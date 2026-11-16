/**
 * Design rows #15-#24 and the account rows #5, #10-#14, end to end against a
 * real database (CMAS_DB_TESTS=1). Each case names the rule it proves.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { prisma } from "../../db/prisma.js"
import {
  courseBody,
  RUN_DB_TESTS,
  setupFixture,
  UNUSED_ID,
  type Fixture,
} from "../../test/db-fixture.js"

describe.skipIf(!RUN_DB_TESTS)("courses and accounts against the database", () => {
  let f: Fixture
  let courseId: string

  beforeAll(async () => {
    f = await setupFixture()
  }, 60_000)
  afterAll(async () => {
    await f?.close()
  }, 60_000)

  const post = (who: Parameters<Fixture["call"]>[0], url: string, payload?: object) =>
    f.call(who, { method: "POST", url: `/api/v1${url}`, payload })
  const get = (who: Parameters<Fixture["call"]>[0], url: string) =>
    f.call(who, { method: "GET", url: `/api/v1${url}` })

  describe("POST /courses", () => {
    it("makes the creating instructor an instructor, with the default A–F ladder (FR-22c)", async () => {
      const res = await post("teacherA", "/courses", courseBody("TEST-001"))
      expect(res.statusCode).toBe(201)
      const body = res.json().data
      courseId = body.id
      expect(body.instructors.map((i: { userId: string }) => i.userId)).toEqual([
        f.users.teacherA.id,
      ])
      expect(body.credits).toBe("3.0")
      expect(body.passCriteria).toBe(50) // lower bound of D (design #16)
      expect(body.gradeBands).toHaveLength(8)
    })

    it("answers 409 for the same code, term and section (FR-21)", async () => {
      const res = await post("teacherA", "/courses", courseBody("TEST-001"))
      expect(res.statusCode).toBe(409)
      expect(res.json().message).toBe("รหัสวิชานี้มีอยู่แล้วในภาคเรียนนี้")
    })

    it("refuses a field the body may not carry (A-8)", async () => {
      const res = await post("teacherA", "/courses", courseBody("TEST-002", { id: UNUSED_ID }))
      expect(res.statusCode).toBe(400)
    })

    it("refuses S/U graded on a curve, and passCriteria on A–F อิงเกณฑ์ (422)", async () => {
      const curve = courseBody("TEST-003", {
        gradeScale: "PASS_FAIL",
        gradeMethod: "NORM_REFERENCED",
      })
      expect((await post("teacherA", "/courses", curve)).statusCode).toBe(422)
      expect(
        (await post("teacherA", "/courses", courseBody("TEST-003", { passCriteria: 55 })))
          .statusCode,
      ).toBe(422)
    })

    it("makes an S/U course whose S band is the pass mark (CR-06)", async () => {
      const res = await post(
        "teacherA",
        "/courses",
        courseBody("TEST-004", { gradeScale: "PASS_FAIL", passCriteria: 70 }),
      )
      expect(res.statusCode).toBe(201)
      expect(res.json().data.gradeBands).toEqual([
        { grade: "S", minValue: 70 },
        { grade: "U", minValue: 0 },
      ])
    })

    it("requires ADMIN to name an instructor, and refuses an ADMIN as one (D-1, FR-23)", async () => {
      expect((await post("admin", "/courses", courseBody("TEST-005"))).statusCode).toBe(422)
      const asAdmin = courseBody("TEST-005", { instructors: [{ userId: f.users.admin.id }] })
      const refused = await post("admin", "/courses", asAdmin)
      expect(refused.statusCode).toBe(422)
      expect(refused.json().message).toBe("บัญชีนี้ยังใช้งานไม่ได้")
      const ok = await post(
        "admin",
        "/courses",
        courseBody("TEST-005", { instructors: [{ userId: f.users.teacherB.id }] }),
      )
      expect(ok.statusCode).toBe(201)
    })
  })

  describe("reading courses", () => {
    it("lists only the caller's courses, ADMIN sees all (NFR-06)", async () => {
      const mine = (await get("teacherA", "/courses?q=TEST-&perPage=100")).json()
      expect(
        mine.data.every((c: { instructors: { userId: string }[] }) =>
          c.instructors.some((i) => i.userId === f.users.teacherA.id),
        ),
      ).toBe(true)
      expect(mine.meta).toMatchObject({ page: 1, perPage: 100 })
      const all = (await get("admin", "/courses?q=TEST-&perPage=100")).json()
      expect(all.meta.total).toBeGreaterThan(mine.meta.total)
    })

    it("answers 404 to another instructor, the same bytes as a missing course (A-13)", async () => {
      const foreign = await get("teacherB", `/courses/${courseId}`)
      const missing = await get("teacherB", `/courses/${UNUSED_ID}`)
      expect(foreign.statusCode).toBe(404)
      expect(foreign.body).toBe(missing.body)
    })

    it("lets ADMIN read any course", async () => {
      expect((await get("admin", `/courses/${courseId}`)).statusCode).toBe(200)
    })

    it("says what still blocks a course, on the list and on the course (FR-84)", async () => {
      const one = (await get("teacherA", `/courses/${courseId}`)).json().data
      expect(one.readiness.blockers.length).toBeGreaterThan(0) // no CLO, activity or student yet
      const list = (await get("teacherA", "/courses?q=TEST-001")).json().data
      expect(list.find((c: { id: string }) => c.id === courseId).readiness).toEqual(one.readiness)
    })
  })

  describe("GET /users/instructors (G1)", () => {
    it("finds active instructors by name or email, and nothing more than id, name and email", async () => {
      const res = await get("teacherA", "/users/instructors?q=TEST%20teacher")
      expect(res.statusCode).toBe(200)
      const hits: Record<string, unknown>[] = res.json().data
      const ids = hits.map((h) => h.id)
      expect(ids).toEqual(expect.arrayContaining([f.users.teacherB.id, f.users.teacherC.id]))
      expect(ids).not.toContain(f.users.admin.id) // ADMIN does not teach (D-1)
      for (const h of hits) expect(Object.keys(h).sort()).toEqual(["email", "id", "name"])
      const byEmail = (await get("teacherA", `/users/instructors?q=teacherb`)).json().data
      expect(byEmail.map((h: { id: string }) => h.id)).toContain(f.users.teacherB.id)
    })

    it("needs a search term and a signed-in caller", async () => {
      expect((await get("teacherA", "/users/instructors")).statusCode).toBe(400)
      expect((await get(null, "/users/instructors?q=TEST")).statusCode).toBe(401)
    })
  })

  describe("PATCH /courses/:courseId", () => {
    it("lets the instructor edit, and re-derives the ladder when the method changes", async () => {
      const res = await f.call("teacherA", {
        method: "PATCH",
        url: `/api/v1/courses/${courseId}`,
        payload: { name: "แก้ชื่อแล้ว", gradeMethod: "NORM_REFERENCED", passCriteria: 55 },
      })
      expect(res.statusCode).toBe(200)
      expect(res.json().data).toMatchObject({
        name: "แก้ชื่อแล้ว",
        gradeMethod: "NORM_REFERENCED",
        passCriteria: 55,
      })
      const bands = await prisma.gradeBand.findMany({
        where: { courseId },
        orderBy: { minValue: "desc" },
      })
      expect(bands[0]).toMatchObject({ grade: "A", minValue: 65 }) // T-score ladder
    })

    it("refuses ADMIN with 403 and records the refusal (D-1, S-10)", async () => {
      const res = await f.call("admin", {
        method: "PATCH",
        url: `/api/v1/courses/${courseId}`,
        payload: { name: "x" },
      })
      expect(res.statusCode).toBe(403)
      const deny = await prisma.authEvent.findFirst({
        where: { userId: f.users.admin.id, action: "DENY" },
      })
      expect(deny?.detail).toContain("course.settings")
    })
  })

  describe("instructors", () => {
    it("adds an instructor, refuses a duplicate (409) and an unusable account (422)", async () => {
      const url = `/courses/${courseId}/instructors`
      expect((await post("teacherA", url, { userId: f.users.teacherB.id })).statusCode).toBe(201)
      expect((await post("teacherA", url, { userId: f.users.teacherB.id })).statusCode).toBe(409)
      expect((await post("teacherA", url, { userId: UNUSED_ID })).statusCode).toBe(422)
      expect((await get("teacherB", `/courses/${courseId}`)).statusCode).toBe(200) // now visible
    })

    it("refuses removing yourself and the last instructor (S-9), removes otherwise", async () => {
      const del = (who: "teacherA" | "teacherB" | "admin", userId: string) =>
        f.call(who, { method: "DELETE", url: `/api/v1/courses/${courseId}/instructors/${userId}` })
      expect((await del("teacherA", f.users.teacherA.id)).statusCode).toBe(422)
      expect((await del("teacherA", f.users.teacherC.id)).statusCode).toBe(404)
      expect((await del("teacherA", f.users.teacherB.id)).statusCode).toBe(200)
      const last = await del("admin", f.users.teacherA.id)
      expect(last.statusCode).toBe(422)
      expect(last.json().message).toBe("รายวิชาต้องมีผู้สอนอย่างน้อย 1 คน")
    })
  })

  describe("duplicate, impact and delete", () => {
    it("copies into the next free section and puts the caller on it (design #24, P17)", async () => {
      const res = await post("teacherA", `/courses/${courseId}/duplicate`)
      expect(res.statusCode).toBe(201)
      expect(res.json().data).toMatchObject({ code: "TEST-001", section: "02" })
    })

    it("answers 404 when the caller cannot see the source", async () => {
      expect((await post("teacherB", `/courses/${courseId}/duplicate`)).statusCode).toBe(404)
    })

    it("refuses DELETE without confirm, with the impact, and deletes with it (FR-26)", async () => {
      const impact = (await get("teacherA", `/courses/${courseId}/impact`)).json().data
      const noConfirm = await f.call("teacherA", {
        method: "DELETE",
        url: `/api/v1/courses/${courseId}`,
      })
      expect(noConfirm.statusCode).toBe(422)
      expect(noConfirm.json().errors).toEqual(impact)
      const done = await f.call("teacherA", {
        method: "DELETE",
        url: `/api/v1/courses/${courseId}?confirm=true`,
      })
      expect(done.statusCode).toBe(200)
      expect(await prisma.course.findUnique({ where: { id: courseId } })).toBeNull()
    })
  })

  describe("accounts", () => {
    it("GET /auth/me reads the live row (NFR-19)", async () => {
      const res = await get("teacherA", "/auth/me")
      expect(res.statusCode).toBe(200)
      expect(res.json().data).toMatchObject({
        id: f.users.teacherA.id,
        role: "INSTRUCTOR",
        status: "ACTIVE",
      })
      expect(res.json().data).not.toHaveProperty("googleSub") // A-9
    })

    it("refuses changing your own role and making a teacher ADMIN (design #11)", async () => {
      const patch = (userId: string, payload: object) =>
        f.call("admin", { method: "PATCH", url: `/api/v1/users/${userId}`, payload })
      expect((await patch(f.users.admin.id, { role: "INSTRUCTOR" })).statusCode).toBe(422)
      expect((await patch(f.users.teacherA.id, { role: "ADMIN" })).statusCode).toBe(422) // still teaches TEST-001 Sec 02
      expect((await patch(f.users.teacherC.id, { name: "TEST renamed" })).statusCode).toBe(200)
    })

    it("switches an account off, which locks it out on its next request (FR-03)", async () => {
      const off = await f.call("admin", {
        method: "PATCH",
        url: `/api/v1/users/${f.users.teacherC.id}/status`,
        payload: { isActive: false },
      })
      expect(off.statusCode).toBe(200)
      expect((await get("teacherC", "/auth/me")).statusCode).toBe(401)
      expect(
        (
          await f.call("admin", {
            method: "PATCH",
            url: `/api/v1/users/${f.users.admin.id}/status`,
            payload: { isActive: false },
          })
        ).statusCode,
      ).toBe(422)
    })

    it("lists the account's history newest first (design #14)", async () => {
      const res = await get("admin", `/users/${f.users.teacherC.id}/auth-events`)
      expect(res.statusCode).toBe(200)
      expect(res.json().data.map((e: { action: string }) => e.action)).toEqual(["SUSPEND", "EDIT"])
      expect((await get("teacherA", `/users/${f.users.teacherC.id}/auth-events`)).statusCode).toBe(
        403,
      )
    })
  })
})
