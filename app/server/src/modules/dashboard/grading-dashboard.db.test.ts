/**
 * Design rows #61 and #65-#76 end to end against a real database
 * (CMAS_DB_TESTS=1): one small course with known scores, checked number by
 * number against SRS CR-03 … CR-11.
 *
 * The course: CLO 1 (objective 1.1, weight 100) measured by Quiz (weight 30,
 * max 10) and Final (weight 70, max 50), each fully on 1.1.
 *   s1: 10/10, 40/50 → total 86  · CLO 86 → PASS
 *   s2:  3/10, 20/50 → total 37  · CLO 37 → AT_RISK, course fail
 *   s3:  8/10, —     → total 80 (provisional) · not complete
 *   s4:  —, —        → NOT_EVALUATED
 */
import * as XLSX from "xlsx"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { courseBody, RUN_DB_TESTS, setupFixture, type Fixture } from "../../test/db-fixture.js"

describe.skipIf(!RUN_DB_TESTS)("grading and dashboard against the database", () => {
  let f: Fixture
  let courseId: string
  let cloId: string
  const stu: Record<string, string> = {}
  let quiz: string
  let final: string

  type Who = Parameters<Fixture["call"]>[0]
  const req = (
    who: Who,
    method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE",
    url: string,
    payload?: object,
  ) => f.call(who, { method, url: `/api/v1${url}`, payload })

  beforeAll(async () => {
    f = await setupFixture()
    const t = "teacherA"
    courseId = (await req(t, "POST", "/courses", courseBody("TEST-P6"))).json().data.id
    cloId = (
      await req(t, "POST", `/courses/${courseId}/clos`, {
        number: 1,
        description: "c1",
        bloomLevel: "APPLY",
        weight: 100,
      })
    ).json().data.id
    const objId = (
      await req(t, "POST", `/clos/${cloId}/objectives`, {
        number: 1,
        description: "o",
        weight: 100,
      })
    ).json().data.id
    quiz = (
      await req(t, "POST", `/courses/${courseId}/activities`, {
        name: "Quiz",
        type: "TEST",
        maxScore: 10,
        weight: 30,
      })
    ).json().data.id
    final = (
      await req(t, "POST", `/courses/${courseId}/activities`, {
        name: "Final",
        type: "TEST",
        maxScore: 50,
        weight: 70,
      })
    ).json().data.id
    await req(t, "PUT", `/courses/${courseId}/criteria`, {
      cells: [
        { activityId: quiz, objectiveId: objId, weight: 100 },
        { activityId: final, objectiveId: objId, weight: 100 },
      ],
    })
    for (const k of ["s1", "s2", "s3", "s4"]) {
      stu[k] = (
        await req(t, "POST", `/courses/${courseId}/students`, { studentCode: `66${k}`, name: k })
      ).json().data.id
    }
    const cell = (s: string, a: string, score: number) => ({
      studentId: stu[s],
      activityId: a,
      score,
      from: null,
    })
    const put = await req(t, "PUT", `/courses/${courseId}/scores`, {
      scores: [
        cell("s1", quiz, 10),
        cell("s1", final, 40),
        cell("s2", quiz, 3),
        cell("s2", final, 20),
        cell("s3", quiz, 8),
      ],
    })
    expect(put.statusCode).toBe(200)
  }, 180_000)
  afterAll(async () => {
    await f?.close()
  }, 60_000)

  it("reports attainment over evaluable students only, and who needs help (CR-04, CR-05.1)", async () => {
    const res = await req("teacherA", "GET", `/courses/${courseId}/dashboard/attainment`)
    expect(res.statusCode).toBe(200)
    expect(res.json().meta).toMatchObject({ computable: true, blockers: [] })
    expect(res.json().data.helpCount).toBe(1)
    // s1 PASS, s2 AT_RISK, s3 PASS (provisional 80), s4 not evaluated → 2 of 3
    expect(res.json().data.clos[0]).toMatchObject({
      attainment: 66.67,
      passedCount: 2,
      evaluableCount: 3,
      notEvaluatedCount: 1,
      provisionalCount: 1,
      status: "NOT_ACHIEVED",
    })
  })

  it("lists only students who need action, course failures first (CR-03.1, CR-05.1)", async () => {
    const res = await req("teacherA", "GET", `/courses/${courseId}/dashboard/at-risk`)
    const rows = res.json().data
    expect(rows.map((r: { studentId: string }) => r.studentId)).toEqual([stu.s2])
    expect(rows[0]).toMatchObject({ level: "COURSE_FAIL", totalScore: 37, coursePassed: false })
    expect(rows[0].failedClos[0]).toMatchObject({ score: 37, gap: 23, near: false, hasPlan: false })
    expect(res.json().meta).toEqual({ atRiskCount: 1, notEvaluatedCount: 1, evaluatedCount: 3 })
  })

  it("gives the individual report with raw score beside percent (FR-85, M5)", async () => {
    const res = await req("teacherA", "GET", `/courses/${courseId}/dashboard/students/${stu.s3}`)
    expect(res.statusCode).toBe(200)
    const body = res.json().data
    expect(body.clos[0]).toMatchObject({ score: 80, status: "PASS", provisional: true })
    expect(body.activities).toEqual([
      expect.objectContaining({ name: "Quiz", score: 8, percent: 80, status: "SCORED" }),
      expect.objectContaining({ name: "Final", score: null, status: "MISSING" }),
    ])
    expect(body.coursePassed).toBeNull() // incomplete is not "ไม่ผ่าน" (FR-62)
    expect(
      (await req("teacherB", "GET", `/courses/${courseId}/dashboard/students/${stu.s3}`))
        .statusCode,
    ).toBe(404)
  })

  it("shows the live grades before freezing, and none for incomplete students (CR-09)", async () => {
    const res = await req("teacherA", "GET", `/courses/${courseId}/grading`)
    const by = Object.fromEntries(
      res.json().data.students.map((s: { studentId: string }) => [s.studentId, s]),
    )
    expect(by[stu.s1]).toMatchObject({ totalPercent: 86, derivedGrade: "A", issuedGrade: null })
    expect(by[stu.s2]).toMatchObject({ totalPercent: 37, derivedGrade: "F" })
    expect(by[stu.s3]).toMatchObject({ complete: false, derivedGrade: null })
    expect(res.json().data.passCriteriaSource).toBe("LADDER")
    expect(res.json().meta.warnings).toContain("นักศึกษา 2 คนคะแนนยังไม่ครบ จะยังไม่ได้เกรด")
  })

  it("replaces the ladder and re-derives passCriteria from it (design #66)", async () => {
    const bands = [
      { grade: "A", minValue: 85 },
      { grade: "B", minValue: 70 },
      { grade: "D", minValue: 40 },
      { grade: "F", minValue: 0 },
    ]
    const res = await req("teacherA", "PUT", `/courses/${courseId}/grade-bands`, { bands })
    expect(res.statusCode).toBe(200)
    expect(res.json().data.passCriteria).toBe(40)
    expect(
      (
        await req("teacherA", "PUT", `/courses/${courseId}/grade-bands`, {
          bands: bands.slice(0, 3),
        })
      ).statusCode,
    ).toBe(422) // no 0 band
    expect(
      (await req("admin", "PUT", `/courses/${courseId}/grade-bands`, { bands })).statusCode,
    ).toBe(403) // D-1
  })

  it("freezes, keeps an override with its reason, and refuses a scale change while frozen (CR-11)", async () => {
    const run = await req("teacherA", "POST", `/courses/${courseId}/grading/run`)
    expect(run.statusCode).toBe(200)
    expect(run.json().data).toMatchObject({ issued: 2, skipped: 2 })

    const o = await req("teacherA", "PUT", `/students/${stu.s2}/grade-override`, {
      grade: "D",
      reason: "พิจารณาจากงานเพิ่มเติม",
    })
    expect(o.json().data).toEqual({
      studentId: stu.s2,
      derivedGrade: "F",
      issuedGrade: "D",
      overrideReason: "พิจารณาจากงานเพิ่มเติม",
    })
    expect(
      (
        await req("teacherA", "PUT", `/students/${stu.s2}/grade-override`, {
          grade: "Z",
          reason: "x",
        })
      ).statusCode,
    ).toBe(422)
    expect(
      (
        await req("teacherA", "PUT", `/students/${stu.s3}/grade-override`, {
          grade: "A",
          reason: "x",
        })
      ).statusCode,
    ).toBe(422) // not frozen for s3

    const again = await req("teacherA", "POST", `/courses/${courseId}/grading/run`)
    expect(again.statusCode).toBe(200)
    const g = await req("teacherA", "GET", `/courses/${courseId}/grading`)
    const s2 = g.json().data.students.find((s: { studentId: string }) => s.studentId === stu.s2)
    expect(s2).toMatchObject({ issuedGrade: "D", overrideReason: "พิจารณาจากงานเพิ่มเติม" })

    const change = await req("teacherA", "PATCH", `/courses/${courseId}`, {
      gradeMethod: "NORM_REFERENCED",
    })
    expect(change.statusCode).toBe(422)
    expect((await req("teacherA", "POST", `/students/${stu.s1}/withdraw`)).statusCode).toBe(422) // frozen
  })

  it("clears an override back to the ladder, then unfreezes with confirm (design #68, #70)", async () => {
    const c = await req("teacherA", "DELETE", `/students/${stu.s2}/grade-override`)
    expect(c.json().data).toMatchObject({ issuedGrade: "F", overrideReason: null })
    expect((await req("teacherA", "DELETE", `/students/${stu.s2}/grade-override`)).statusCode).toBe(
      404,
    )
    expect((await req("teacherA", "DELETE", `/courses/${courseId}/grading`)).statusCode).toBe(422)
    const u = await req("teacherA", "DELETE", `/courses/${courseId}/grading?confirm=true`)
    expect(u.json().data).toEqual({ unfrozen: 2 })
  })

  it("exports the same numbers to Excel (design #61, #71, #76 · FR-88)", async () => {
    const grades = await req("teacherA", "GET", `/courses/${courseId}/grades/export`)
    expect(grades.statusCode).toBe(200)
    const wb = XLSX.read(grades.rawPayload)
    expect(wb.SheetNames).toEqual(["สรุปราย CLO", "ยังไม่ผ่านราย CLO", "เกรด"])
    const summary = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets["สรุปราย CLO"]!, { header: 1 })
    expect(summary.find((r) => r[0] === "CLO 1")).toEqual(["CLO 1", "c1", 2, 3, 1, 66.67, 100])

    const scores = await req("teacherA", "GET", `/courses/${courseId}/scores/export?type=raw`)
    expect(XLSX.read(scores.rawPayload).SheetNames).toEqual(["คะแนนดิบ"])
    expect(
      (await req("teacherA", "GET", `/courses/${courseId}/scores/export?type=bad`)).statusCode,
    ).toBe(400)

    const one = await req(
      "teacherA",
      "GET",
      `/courses/${courseId}/dashboard/export?scope=student&studentId=${stu.s1}`,
    )
    expect(one.statusCode).toBe(200)
    expect(
      (await req("teacherA", "GET", `/courses/${courseId}/dashboard/export?scope=student`))
        .statusCode,
    ).toBe(400)
    expect((await req("admin", "GET", `/courses/${courseId}/grades/export`)).statusCode).toBe(403) // D-1
  })

  it("sums the overview over the caller's courses only (design #72, NFR-06)", async () => {
    const a = (await req("teacherA", "GET", "/dashboard/overview")).json().data
    expect(a).toMatchObject({
      courseCount: 1,
      studentCount: 4,
      cloTotal: 1,
      scoreProgress: { scored: 5, expected: 8 },
    })
    const b = (await req("teacherB", "GET", "/dashboard/overview")).json().data
    expect(b).toMatchObject({ courseCount: 0, studentCount: 0 })
  })
})
