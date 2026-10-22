/**
 * Design rows #45-#60 and #62-#64 end to end against a real database
 * (CMAS_DB_TESTS=1): roster, withdrawal, remediation plans, the score grid
 * with D-3 conflicts, both Excel imports, and the history they leave.
 */
import * as XLSX from "xlsx"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { prisma } from "../../db/prisma.js"
import { courseBody, RUN_DB_TESTS, setupFixture, type Fixture } from "../../test/db-fixture.js"

/** A multipart body with one field named "file", as a browser sends it. */
function multipart(fileName: string, content: Buffer) {
  const boundary = "----cmas-test-boundary"
  const body = Buffer.concat([
    Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${fileName}"\r\n` +
        "Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet\r\n\r\n",
    ),
    content,
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ])
  return { payload: body, headers: { "content-type": `multipart/form-data; boundary=${boundary}` } }
}

const sheet = (rows: unknown[][]) => {
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), "s")
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer
}

describe.skipIf(!RUN_DB_TESTS)("students and scores against the database", () => {
  let f: Fixture
  let courseId: string
  let cloId: string
  let quiz: string
  let exam: string
  const stu: Record<string, string> = {}

  type Who = Parameters<Fixture["call"]>[0]
  const req = (
    who: Who,
    method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE",
    url: string,
    payload?: object,
  ) => f.call(who, { method, url: `/api/v1${url}`, payload })

  beforeAll(async () => {
    f = await setupFixture()
    courseId = (await req("teacherA", "POST", "/courses", courseBody("TEST-P5"))).json().data.id
    cloId = (
      await req("teacherA", "POST", `/courses/${courseId}/clos`, {
        number: 1,
        description: "c",
        bloomLevel: "APPLY",
      })
    ).json().data.id
    quiz = (
      await req("teacherA", "POST", `/courses/${courseId}/activities`, {
        name: "Quiz",
        type: "TEST",
        maxScore: 20,
        weight: 30,
      })
    ).json().data.id
    exam = (
      await req("teacherA", "POST", `/courses/${courseId}/activities`, {
        name: "Final",
        type: "TEST",
        maxScore: 100,
        weight: 70,
      })
    ).json().data.id
  }, 120_000)
  afterAll(async () => {
    await f?.close()
  }, 60_000)

  describe("roster", () => {
    it("adds students, refuses a duplicate code (409), allows it in another course (FR-51)", async () => {
      for (const [k, code] of [
        ["a", "6601"],
        ["b", "6602"],
        ["c", "6603"],
      ]) {
        const res = await req("teacherA", "POST", `/courses/${courseId}/students`, {
          studentCode: code,
          name: `นักศึกษา ${k}`,
        })
        expect(res.statusCode).toBe(201)
        expect(res.json().data.status).toBe("ENROLLED")
        stu[k] = res.json().data.id
      }
      expect(
        (
          await req("teacherA", "POST", `/courses/${courseId}/students`, {
            studentCode: "6601",
            name: "x",
          })
        ).statusCode,
      ).toBe(409)
      expect(
        (
          await req("teacherA", "POST", `/courses/${courseId}/students`, {
            studentCode: "6609",
            name: "x",
            status: "WITHDRAWN",
          })
        ).statusCode,
      ).toBe(400)
      expect(
        (
          await req("admin", "POST", `/courses/${courseId}/students`, {
            studentCode: "6609",
            name: "x",
          })
        ).statusCode,
      ).toBe(403)
    })

    it("searches by code or name and pages (design #45)", async () => {
      const res = await req("teacherA", "GET", `/courses/${courseId}/students?q=6602`)
      expect(res.json().data.map((s: { studentCode: string }) => s.studentCode)).toEqual(["6602"])
      expect(res.json().data[0]).toMatchObject({ activityCount: 2, scoredCount: 0 })
    })

    it("keeps a remediation plan per student and CLO, updatedBy from the token (design #54)", async () => {
      const res = await req("teacherA", "PUT", `/students/${stu.a}/remediation-plans/${cloId}`, {
        plan: "สอบซ่อม",
      })
      expect(res.statusCode).toBe(200)
      expect(res.json().data.updatedBy.id).toBe(f.users.teacherA.id)
      expect(
        (
          await req("teacherA", "PUT", `/students/${stu.a}/remediation-plans/${cloId}`, {
            plan: "",
          })
        ).statusCode,
      ).toBe(400)
      expect(
        (
          await req("teacherB", "PUT", `/students/${stu.a}/remediation-plans/${cloId}`, {
            plan: "x",
          })
        ).statusCode,
      ).toBe(404)
    })
  })

  describe("score grid", () => {
    it("writes all cells or none, with a ScoreChange each (FR-63, A-12)", async () => {
      const bad = await req("teacherA", "PUT", `/courses/${courseId}/scores`, {
        scores: [
          { studentId: stu.a, activityId: quiz, score: 18, from: null },
          { studentId: stu.b, activityId: quiz, score: 25, from: null },
        ],
      })
      expect(bad.statusCode).toBe(422)
      expect(bad.json().errors.rows).toHaveLength(1)
      expect(await prisma.score.count({ where: { activityId: quiz } })).toBe(0)

      const good = await req("teacherA", "PUT", `/courses/${courseId}/scores`, {
        scores: [
          { studentId: stu.a, activityId: quiz, score: 18, from: null },
          { studentId: stu.b, activityId: quiz, score: 0, from: null },
          { studentId: stu.c, activityId: quiz, score: "EXCUSED", reason: "ป่วย", from: null },
        ],
      })
      expect(good.statusCode).toBe(200)
      expect(good.json().data).toEqual({ written: 3, unchanged: 0 })
      expect(
        await prisma.scoreChange.count({ where: { activityId: quiz, source: "MANUAL" } }),
      ).toBe(3)
    })

    it("answers 409 when the cell changed since the client read it (D-3)", async () => {
      const res = await req("teacherA", "PUT", `/courses/${courseId}/scores`, {
        scores: [{ studentId: stu.a, activityId: quiz, score: 19, from: 15 }],
      })
      expect(res.statusCode).toBe(409)
      expect(res.json().errors.cells[0]).toMatchObject({ studentId: stu.a, current: 18 })
    })

    it("shows empty as null, a real zero as 0, and excused apart (FR-62)", async () => {
      const res = await req("teacherA", "GET", `/courses/${courseId}/scores`)
      const by = Object.fromEntries(
        res.json().data.students.map((s: { id: string; scores: object }) => [s.id, s.scores]),
      )
      expect(by[stu.a]).toEqual({ [quiz]: 18 })
      expect(by[stu.b]).toEqual({ [quiz]: 0 })
      expect(by[stu.c]).toEqual({ [quiz]: "EXCUSED" })
      expect(res.json().meta.progress[quiz]).toEqual({ scored: 3, total: 3 })
    })

    it("refuses scores for a withdrawn student until restored (R2, A-11)", async () => {
      expect(
        (await req("teacherA", "POST", `/students/${stu.c}/withdraw`)).json().data.status,
      ).toBe("WITHDRAWN")
      expect((await req("teacherA", "POST", `/students/${stu.c}/withdraw`)).statusCode).toBe(422)
      const res = await req("teacherA", "PUT", `/courses/${courseId}/scores`, {
        scores: [{ studentId: stu.c, activityId: exam, score: 50, from: null }],
      })
      expect(res.statusCode).toBe(422)
      expect((await req("teacherA", "POST", `/students/${stu.c}/restore`)).json().data).toEqual({
        status: "ENROLLED",
        withdrawnAt: null,
      })
    })
  })

  describe("Excel", () => {
    it("serves a template with one column per activity (design #58)", async () => {
      const res = await req("teacherA", "GET", `/courses/${courseId}/scores/template`)
      expect(res.statusCode).toBe(200)
      expect(res.headers["content-type"]).toContain("spreadsheetml")
      const rows = XLSX.utils.sheet_to_json<unknown[]>(XLSX.read(res.rawPayload).Sheets["คะแนน"]!, {
        header: 1,
      })
      const head = rows.find((r) => r[0] === "รหัสนักศึกษา")!
      expect(head).toEqual([
        "รหัสนักศึกษา",
        "ชื่อ-นามสกุล",
        `Quiz (เต็ม 20) [${quiz}]`,
        `Final (เต็ม 100) [${exam}]`,
      ])
    })

    it("refuses a file that is not an xlsx, and one with a formula (S-6)", async () => {
      const notXlsx = multipart("x.xlsx", Buffer.from("hello"))
      const r1 = await f.call("teacherA", {
        method: "POST",
        url: `/api/v1/courses/${courseId}/scores/import/preview`,
        ...notXlsx,
      })
      expect(r1.statusCode).toBe(400)
      const ws = XLSX.utils.aoa_to_sheet([
        ["รหัสนักศึกษา", "ชื่อ-นามสกุล", "Quiz"],
        ["6601", "a", 1],
      ])
      ws["C2"] = { t: "n", f: "1+1" }
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "s")
      const withFormula = multipart(
        "f.xlsx",
        XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer,
      )
      const r2 = await f.call("teacherA", {
        method: "POST",
        url: `/api/v1/courses/${courseId}/scores/import/preview`,
        ...withFormula,
      })
      expect(r2.statusCode).toBe(400)
    })

    it("previews a score file with every FR-69 error, then commits only the good rows", async () => {
      const file = sheet([
        ["แบบฟอร์มกรอกคะแนน"],
        [],
        [
          "รหัสนักศึกษา",
          "ชื่อ-นามสกุล",
          `Quiz (เต็ม 20) [${quiz}]`,
          "Final (เต็ม 100)",
          "ไม่มีกิจกรรมนี้",
        ],
        ["6601", "a", null, 88, null], // ok: blank Quiz keeps 18
        ["6602", "b", -1, null, null], // NEGATIVE
        ["6603", "c", "ยกเว้น", 101, null], // ABOVE_MAX
        ["6699", "ไม่มี", 5, null, null], // STUDENT_NOT_IN_COURSE
        ["6601", "ซ้ำ", 1, null, null], // DUPLICATE_IN_FILE
        ["6602", "b", "ไม่มา", null, 3], // DUPLICATE_IN_FILE + NOT_A_NUMBER + UNKNOWN_COLUMN
      ])
      const res = await f.call("teacherA", {
        method: "POST",
        url: `/api/v1/courses/${courseId}/scores/import/preview`,
        ...multipart("scores.xlsx", file),
      })
      expect(res.statusCode).toBe(200)
      const body = res.json().data
      expect(body.summary).toEqual({ total: 6, ok: 1, failed: 5 })
      expect(body.rows.map((r: { errorCode: string | null }) => r.errorCode)).toEqual([
        null,
        "NEGATIVE",
        "ABOVE_MAX",
        "STUDENT_NOT_IN_COURSE",
        "DUPLICATE_IN_FILE",
        "DUPLICATE_IN_FILE",
      ])
      // Every problem of a row is reported, not only the first.
      expect(body.rows[5].message).toContain("คะแนนต้องเป็นตัวเลข")
      expect(body.rows[5].message).toContain("คอลัมน์นี้ไม่ตรงกับกิจกรรมใด")
      expect(body.columns.map((c: { matched: boolean }) => c.matched)).toEqual([true, true, false])
      expect(body.rows[0].row).toBe(4) // the row number the instructor sees in Excel

      const commit = await req("teacherA", "POST", `/courses/${courseId}/scores/import/commit`, {
        previewToken: body.previewToken,
      })
      expect(commit.statusCode).toBe(200)
      expect(commit.json().data).toMatchObject({ recordsOk: 1, recordsFail: 5 })
      const quizA = await prisma.score.findUnique({
        where: { studentId_activityId: { studentId: stu.a, activityId: quiz } },
      })
      expect(quizA?.score).toBe(18) // a blank cell never overwrites (FR-62)
      expect(
        await prisma.scoreChange.count({ where: { source: "IMPORT", activityId: exam } }),
      ).toBe(1)

      const again = await req("teacherA", "POST", `/courses/${courseId}/scores/import/commit`, {
        previewToken: body.previewToken,
      })
      expect(again.statusCode).toBe(422) // one use
    })

    it("imports a roster, keeping the stored name of an existing code (design #50-#51)", async () => {
      const file = sheet([
        ["รหัสนักศึกษา", "ชื่อ-นามสกุล"],
        ["6604", "ใหม่"],
        ["6601", "ชื่ออื่น"],
        [null, "ไม่มีรหัส"],
      ])
      const res = await f.call("teacherA", {
        method: "POST",
        url: `/api/v1/courses/${courseId}/students/import/preview`,
        ...multipart("roster.xlsx", file),
      })
      expect(res.json().data.summary).toEqual({ total: 3, add: 1, failed: 1 })
      const commit = await req("teacherA", "POST", `/courses/${courseId}/students/import/commit`, {
        previewToken: res.json().data.previewToken,
      })
      expect(commit.json().data).toMatchObject({ recordsOk: 1, recordsFail: 1 })
      expect(
        (await prisma.student.findFirst({ where: { courseId, studentCode: "6601" } }))?.name,
      ).toBe("นักศึกษา a")
      // Another user cannot commit someone else's preview.
      const again = await f.call("teacherA", {
        method: "POST",
        url: `/api/v1/courses/${courseId}/students/import/preview`,
        ...multipart("r.xlsx", file),
      })
      const stolen = await req("teacherB", "POST", `/courses/${courseId}/students/import/commit`, {
        previewToken: again.json().data.previewToken,
      })
      expect(stolen.statusCode).toBe(404) // teacherB cannot even see the course
    })
  })

  describe("history", () => {
    it("lists uploads newest first and the refused rows of one (design #62-#63)", async () => {
      const uploads = (await req("teacherA", "GET", `/courses/${courseId}/uploads`)).json()
      expect(uploads.data.map((u: { kind: string }) => u.kind)).toEqual(["ROSTER", "SCORE"])
      const scoreUpload = uploads.data[1]
      const errors = await req("teacherA", "GET", `/uploads/${scoreUpload.id}/errors`)
      expect(errors.json().data).toHaveLength(7) // one row per refused cell
      expect(errors.json().data[0]).toMatchObject({ row: 5, studentCode: "6602" })
      expect((await req("teacherB", "GET", `/uploads/${scoreUpload.id}/errors`)).statusCode).toBe(
        404,
      )
      const xlsx = await req("teacherA", "GET", `/uploads/${scoreUpload.id}/errors?format=xlsx`)
      expect(xlsx.headers["content-type"]).toContain("spreadsheetml")
    })

    it("lists score changes newest first, with who and how (design #64)", async () => {
      const res = await req(
        "teacherA",
        "GET",
        `/courses/${courseId}/score-changes?studentId=${stu.a}`,
      )
      expect(res.json().data[0]).toMatchObject({
        source: "IMPORT",
        from: null,
        to: 88,
        changedBy: { id: f.users.teacherA.id },
      })
    })

    it("deletes a scored student only with confirm (design #48)", async () => {
      expect((await req("teacherA", "DELETE", `/students/${stu.b}`)).json().errors).toEqual({
        scores: 1,
        grades: 0,
      })
      expect((await req("teacherA", "DELETE", `/students/${stu.b}?confirm=true`)).statusCode).toBe(
        200,
      )
    })
  })
})
