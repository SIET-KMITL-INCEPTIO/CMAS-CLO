/**
 * Design rows #25-#44 end to end against a real database (CMAS_DB_TESTS=1):
 * CLOs and objectives, activities, the criteria matrix, group weights, and
 * closing an activity. Each case names the rule it proves.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { prisma } from "../../db/prisma.js"
import { courseBody, RUN_DB_TESTS, setupFixture, type Fixture } from "../../test/db-fixture.js"

describe.skipIf(!RUN_DB_TESTS)("CLOs, activities and criteria against the database", () => {
  let f: Fixture
  let courseId: string
  const clo: Record<string, string> = {}
  const obj: Record<string, string> = {}
  const act: Record<string, string> = {}

  type Who = Parameters<Fixture["call"]>[0]
  const req = (
    who: Who,
    method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE",
    url: string,
    payload?: object,
  ) => f.call(who, { method, url: `/api/v1${url}`, payload })

  beforeAll(async () => {
    f = await setupFixture()
    const res = await req("teacherA", "POST", "/courses", courseBody("TEST-P3"))
    courseId = res.json().data.id
  }, 60_000)
  afterAll(async () => {
    await f?.close()
  }, 60_000)

  describe("CLOs", () => {
    it("requires a Bloom level and derives SOLO from it when AUTO (O3)", async () => {
      expect(
        (
          await req("teacherA", "POST", `/courses/${courseId}/clos`, {
            number: 1,
            description: "x",
          })
        ).statusCode,
      ).toBe(400)
      const res = await req("teacherA", "POST", `/courses/${courseId}/clos`, {
        number: 1,
        description: "อธิบายหลักการ",
        bloomLevel: "UNDERSTAND",
        weight: 40,
      })
      expect(res.statusCode).toBe(201)
      expect(res.json().data).toMatchObject({
        soloLevel: "SURFACE",
        levelSource: "AUTO",
        computedWeight: 0,
      })
      clo.c1 = res.json().data.id
    })

    it("refuses soloLevel with AUTO, a duplicate number (409) and ADMIN (403)", async () => {
      const url = `/courses/${courseId}/clos`
      expect(
        (
          await req("teacherA", "POST", url, {
            number: 2,
            description: "x",
            bloomLevel: "APPLY",
            soloLevel: "DEEP",
          })
        ).statusCode,
      ).toBe(400)
      expect(
        (await req("teacherA", "POST", url, { number: 1, description: "x", bloomLevel: "APPLY" }))
          .statusCode,
      ).toBe(409)
      expect(
        (await req("admin", "POST", url, { number: 2, description: "x", bloomLevel: "APPLY" }))
          .statusCode,
      ).toBe(403)
      const c2 = await req("teacherA", "POST", url, {
        number: 2,
        description: "ออกแบบระบบ",
        bloomLevel: "CREATE",
        levelSource: "MANUAL",
        soloLevel: "DEEP",
        weight: 60,
      })
      expect(c2.json().data.soloLevel).toBe("DEEP")
      clo.c2 = c2.json().data.id
    })

    it("moves SOLO with Bloom while AUTO (design #28)", async () => {
      const res = await req("teacherA", "PATCH", `/clos/${clo.c1}`, { bloomLevel: "ANALYZE" })
      expect(res.statusCode).toBe(200)
      expect(res.json().data.soloLevel).toBe("DEEP")
    })

    it("answers 404 on a CLO of a course the caller does not teach (A-3, A-13)", async () => {
      expect(
        (await req("teacherB", "PATCH", `/clos/${clo.c1}`, { description: "y" })).statusCode,
      ).toBe(404)
      expect((await req("teacherB", "GET", `/clos/${clo.c1}/objectives`)).statusCode).toBe(404)
    })

    it("reorders in one transaction (design #27)", async () => {
      const res = await req("teacherA", "PATCH", `/courses/${courseId}/clos/reorder`, {
        order: [clo.c2, clo.c1],
      })
      expect(res.statusCode).toBe(200)
      expect(res.json().data.map((c: { id: string; number: number }) => [c.id, c.number])).toEqual([
        [clo.c2, 1],
        [clo.c1, 2],
      ])
      expect(
        (await req("teacherA", "PATCH", `/courses/${courseId}/clos/reorder`, { order: [clo.c2] }))
          .statusCode,
      ).toBe(422)
    })

    it("adds objectives and warns until they sum to 100 (CR-01)", async () => {
      const a = await req("teacherA", "POST", `/clos/${clo.c1}/objectives`, {
        number: 1,
        description: "บอกได้",
        weight: 50,
      })
      expect(a.statusCode).toBe(201)
      expect(a.json().meta.warnings).toHaveLength(1)
      const b = await req("teacherA", "POST", `/clos/${clo.c1}/objectives`, {
        number: 2,
        description: "อธิบายได้",
        weight: 50,
      })
      expect(b.json().meta).toMatchObject({ weightSum: 100, warnings: [] })
      expect(b.json().data.label).toBe("2.2")
      obj.o1 = a.json().data.id
      obj.o2 = b.json().data.id
      const c = await req("teacherA", "POST", `/clos/${clo.c2}/objectives`, {
        number: 1,
        description: "ออกแบบได้",
        weight: 100,
      })
      obj.o3 = c.json().data.id
    })
  })

  describe("activities", () => {
    it("creates with the default method and a 50% pass score (design #35)", async () => {
      const res = await req("teacherA", "POST", `/courses/${courseId}/activities`, {
        name: "สอบกลางภาค",
        type: "TEST",
        maxScore: 40,
        weight: 60,
      })
      expect(res.statusCode).toBe(201)
      expect(res.json().data).toMatchObject({
        assessmentMethod: "EXAM",
        passScore: 20,
        passMark: 50,
        order: 0,
      })
      act.mid = res.json().data.id
    })

    it("refuses a total above 100% and says how much room is left (FR-43)", async () => {
      const res = await req("teacherA", "POST", `/courses/${courseId}/activities`, {
        name: "งาน",
        type: "LAB",
        maxScore: 10,
        weight: 50,
      })
      expect(res.statusCode).toBe(422)
      expect(res.json().message).toBe("กิจกรรมอื่นรวม 60% แล้ว — ใส่ได้ไม่เกิน 40%")
    })

    it("names a custom type, and its method defaults to OTHER", async () => {
      const res = await req("teacherA", "POST", `/courses/${courseId}/activities`, {
        name: "สัมมนา",
        type: "CUSTOM",
        typeLabel: "สัมมนากลุ่ม",
        maxScore: 10,
        weight: 40,
      })
      expect(res.statusCode).toBe(201)
      expect(res.json().data).toMatchObject({ assessmentMethod: "OTHER", typeLabel: "สัมมนากลุ่ม" })
      expect(res.json().meta).toMatchObject({ totalWeight: 100, isWeightComplete: true })
      act.seminar = res.json().data.id
    })

    it("duplicates with weight 0 and the same objective links (design #41)", async () => {
      const res = await req("teacherA", "POST", `/activities/${act.mid}/duplicate`)
      expect(res.statusCode).toBe(201)
      expect(res.json().data).toMatchObject({ name: "สอบกลางภาค (สำเนา)", weight: 0, order: 2 })
      act.copy = res.json().data.id
    })
  })

  describe("criteria matrix", () => {
    it("replaces the matrix, warns on an activity not at 100, computes CLO shares (CR-02)", async () => {
      const res = await req("teacherA", "PUT", `/courses/${courseId}/criteria`, {
        cells: [
          { activityId: act.mid, objectiveId: obj.o1, weight: 50 },
          { activityId: act.mid, objectiveId: obj.o3, weight: 50 },
          { activityId: act.seminar, objectiveId: obj.o2, weight: 60 },
        ],
      })
      expect(res.statusCode).toBe(200)
      const meta = res.json().meta
      expect(meta.warnings).toEqual([{ activityId: act.seminar, sum: 60 }])
      expect(meta.cloShares).toEqual({ [clo.c1]: 54, [clo.c2]: 30 }) // 60×0.5 + 40×0.6 · 60×0.5
      expect(meta.unlinkedActivityIds).toEqual([act.copy])
      expect(meta.isReadyForDashboard).toBe(false)
    })

    it("refuses a cell from another course (FR-46)", async () => {
      const other = await req("teacherB", "POST", "/courses", courseBody("TEST-P3B"))
      const foreign = await req("teacherB", "POST", `/courses/${other.json().data.id}/activities`, {
        name: "x",
        type: "TEST",
        maxScore: 1,
        weight: 1,
      })
      const res = await req("teacherA", "PUT", `/courses/${courseId}/criteria`, {
        cells: [{ activityId: foreign.json().data.id, objectiveId: obj.o1, weight: 100 }],
      })
      expect(res.statusCode).toBe(422)
    })

    it("lists CLOs with computed weight against the planned one (E2)", async () => {
      const res = await req("teacherA", "GET", `/courses/${courseId}/clos`)
      const c1 = res.json().data.find((c: { id: string }) => c.id === clo.c1)
      expect(c1).toMatchObject({ weight: 40, computedWeight: 54, isMeasured: true })
      expect(res.json().meta.weightWarnings).toHaveLength(2)
    })
  })

  describe("group weights, close and delete", () => {
    it("splits a group weight over its activities by maxScore (N1)", async () => {
      const bad = await req("teacherA", "PUT", `/courses/${courseId}/group-weights`, {
        mode: "GROUP",
        weights: { LAB: 10 },
      })
      expect(bad.statusCode).toBe(422) // no LAB activity in this course
      const res = await req("teacherA", "PUT", `/courses/${courseId}/group-weights`, {
        mode: "GROUP",
        weights: { TEST: 70, "CUSTOM:สัมมนากลุ่ม": 30 },
      })
      expect(res.statusCode).toBe(200)
      const weights = Object.fromEntries(
        res.json().data.activities.map((a: { id: string; weight: number }) => [a.id, a.weight]),
      )
      expect(weights).toEqual({ [act.mid]: 35, [act.copy]: 35, [act.seminar]: 30 })
      expect(
        (await req("teacherA", "PATCH", `/activities/${act.mid}`, { weight: 10 })).statusCode,
      ).toBe(422) // weights come from the group now
      await req("teacherA", "PUT", `/courses/${courseId}/group-weights`, { mode: "MANUAL" })
    })

    it("closes an activity, zeroing the empty cells with a ScoreChange each (R3, A-12)", async () => {
      const students = await prisma.student.createManyAndReturn({
        data: [1, 2].map((i) => ({ courseId, studentCode: `T${i}`, name: `นักศึกษา ${i}` })),
        select: { id: true },
      })
      const res = await req("teacherA", "POST", `/activities/${act.mid}/close`, { blank: "ZERO" })
      expect(res.statusCode).toBe(200)
      expect(res.json().data).toMatchObject({ zeroed: 2, excused: 0, pending: 0 })
      const changes = await prisma.scoreChange.findMany({ where: { activityId: act.mid } })
      expect(changes).toHaveLength(2)
      expect(
        changes.every(
          (c) => c.source === "CLOSE" && c.toScore === 0 && c.changedBy === f.users.teacherA.id,
        ),
      ).toBe(true)
      expect(students).toHaveLength(2)
      expect((await req("teacherA", "POST", `/activities/${act.mid}/close`)).statusCode).toBe(422)
      expect((await req("teacherA", "POST", `/activities/${act.mid}/reopen`)).statusCode).toBe(200)
    })

    it("refuses lowering maxScore under an existing score, with the details (NFR-12)", async () => {
      await prisma.score.updateMany({ where: { activityId: act.mid }, data: { score: 30 } })
      const res = await req("teacherA", "PATCH", `/activities/${act.mid}`, { maxScore: 20 })
      expect(res.statusCode).toBe(422)
      expect(res.json().errors).toEqual({ conflictingScores: 2, maxExistingScore: 30 })
    })

    it("deletes a scored activity only with confirm (design #38), a measured CLO likewise (FR-36)", async () => {
      expect((await req("teacherA", "DELETE", `/activities/${act.mid}`)).json().errors).toEqual({
        scores: 2,
      })
      expect(
        (await req("teacherA", "DELETE", `/activities/${act.mid}?confirm=true`)).statusCode,
      ).toBe(200)
      const c = await req("teacherA", "DELETE", `/clos/${clo.c1}`)
      expect(c.statusCode).toBe(422)
      expect(c.json().errors).toMatchObject({ objectives: 2 })
      expect((await req("teacherA", "DELETE", `/clos/${clo.c1}?confirm=true`)).statusCode).toBe(200)
    })
  })
})
