/**
 * The Excel add-in's sign-in and token against a real, migrated database
 * (0011), through the whole app: ST-XL-01 … 05, FR-73, FR-74.
 *
 * Runs only when CMAS_DB_TESTS=1 (a job that owns a throwaway database).
 *
 * Every request carries its own `remoteAddress`: the sign-in routes are limited
 * per IP (10 an hour or so), and one test file makes far more calls than that
 * from the one address app.inject() would otherwise use. The limits themselves
 * are tested at the end, from one fixed address.
 */
import { createHash, randomBytes } from "node:crypto"
import type { Prisma } from "@prisma/client"
import type { InjectOptions } from "fastify"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { prisma } from "../../db/prisma.js"
import {
  courseBody,
  RUN_DB_TESTS,
  setupFixture,
  UNUSED_ID,
  type Fixture,
} from "../../test/db-fixture.js"
import { hashToken } from "../auth/refresh-token.repository.js"
import { WORKBOOK_RELEASE } from "./addin-release.js"
import { EXCEL_TOKEN_PREFIX, LINK_TTL_MS } from "./excel.service.js"

type Who = Parameters<Fixture["call"]>[0]
type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE"

describe.skipIf(!RUN_DB_TESTS)("Excel add-in sign-in and token (FR-73, FR-74)", () => {
  let f: Fixture
  /** userCodes (no dash) of every code this file made, so cleanup can find the unapproved ones. */
  const made: string[] = []
  let hits = 0

  const freshAddress = () => {
    hits += 1
    return `10.20.${Math.floor(hits / 250)}.${(hits % 250) + 1}`
  }

  const call = (
    who: Who,
    method: Method,
    url: string,
    payload?: object,
    extra: Partial<InjectOptions> = {},
  ) =>
    f.call(who, {
      method,
      url: `/api/v1${url}`,
      remoteAddress: freshAddress(),
      ...(payload ? { payload } : {}),
      ...extra,
    })

  /** A request as the add-in makes it: a Bearer token and no web session. */
  const asAddin = (token: string, method: Method, url: string, payload?: object) =>
    call(null, method, url, payload, { headers: { authorization: `Bearer ${token}` } })

  const start = async () => {
    const res = await call(null, "POST", "/excel/device")
    expect(res.statusCode).toBe(201)
    const data = res.json().data as { deviceCode: string; userCode: string }
    made.push(data.userCode.replace("-", ""))
    return data
  }
  const collect = (deviceCode: string) => call(null, "POST", "/excel/token", { deviceCode })
  const approve = (who: Who, courseId: string, userCode: string) =>
    call(who, "POST", `/courses/${courseId}/excel-links`, { userCode })

  /** The whole dance: the add-in asks, the instructor approves, the add-in collects. */
  const connect = async (who: "teacherA" | "teacherB", courseId: string) => {
    const code = await start()
    expect((await approve(who, courseId, code.userCode)).statusCode).toBe(201)
    const res = await collect(code.deviceCode)
    expect(res.statusCode).toBe(201)
    const token = res.json().data.token as string
    const link = await prisma.excelLink.findFirstOrThrow({ where: { tokenHash: hashToken(token) } })
    return { token, linkId: link.id, ...code }
  }

  let courseA: string
  let courseB: string
  let activity: string
  let student: string

  beforeAll(async () => {
    // The one fixed code below survives a run that crashed before its cleanup.
    await prisma.excelDeviceCode.deleteMany({ where: { userCode: "KKKK2222" } })
    f = await setupFixture()
    const create = async (who: "teacherA" | "teacherB", code: string) =>
      (await call(who, "POST", "/courses", courseBody(code))).json().data.id as string
    courseA = await create("teacherA", "TEST-XL-A")
    courseB = await create("teacherB", "TEST-XL-B")
    activity = (
      await call("teacherA", "POST", `/courses/${courseA}/activities`, {
        name: "Quiz",
        type: "TEST",
        maxScore: 20,
        weight: 100,
      })
    ).json().data.id
    student = (
      await call("teacherA", "POST", `/courses/${courseA}/students`, {
        studentCode: "6601",
        name: "นักศึกษา ก",
      })
    ).json().data.id
  }, 120_000)

  afterAll(async () => {
    // An unapproved code has no user, so deleting the accounts does not reach it.
    await prisma.excelDeviceCode.deleteMany({ where: { userCode: { in: made } } })
    await f?.close()
  }, 60_000)

  describe("signing in with a device code (ST-XL-01)", () => {
    it("waits until the instructor approves, then hands out one token, once", async () => {
      const code = await start()
      expect(code.deviceCode).toMatch(/^[A-Za-z0-9_-]{43}$/)
      expect(code.userCode).toMatch(/^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/)

      const before = await collect(code.deviceCode)
      expect(before.statusCode).toBe(200)
      expect(before.json().data).toMatchObject({ status: "pending" })

      expect((await approve("teacherA", courseA, code.userCode)).statusCode).toBe(201)

      const granted = await collect(code.deviceCode)
      expect(granted.statusCode).toBe(201)
      expect(granted.headers["cache-control"]).toBe("no-store")
      const data = granted.json().data
      expect(data).toMatchObject({ status: "ok", course: { id: courseA, code: "TEST-XL-A" } })
      expect(data.token.startsWith(EXCEL_TOKEN_PREFIX)).toBe(true)

      // The same code never yields a second token.
      expect((await collect(code.deviceCode)).json().data).toEqual({ status: "expired" })
    })

    it("stores only hashes: neither secret can be read back from the database", async () => {
      const { token, deviceCode } = await connect("teacherA", courseA)
      expect(await prisma.excelLink.findFirst({ where: { tokenHash: token } })).toBeNull()
      expect(
        await prisma.excelDeviceCode.findFirst({ where: { deviceCodeHash: deviceCode } }),
      ).toBeNull()
      const code = await prisma.excelDeviceCode.findUniqueOrThrow({
        where: { deviceCodeHash: hashToken(deviceCode) },
      })
      expect(code).toMatchObject({ userId: f.users.teacherA.id, courseId: courseA })
      expect(code.consumedAt).not.toBeNull()
    })

    it("lasts 8 hours", async () => {
      const { linkId } = await connect("teacherA", courseA)
      const link = await prisma.excelLink.findUniqueOrThrow({ where: { id: linkId } })
      const ms = link.expiresAt.getTime() - link.createdAt.getTime()
      expect(Math.abs(ms - LINK_TTL_MS)).toBeLessThan(60_000)
    })

    it("gives one token when two polls race with the same approved code", async () => {
      const code = await start()
      await approve("teacherA", courseA, code.userCode)
      const links = () => prisma.excelLink.count({ where: { courseId: courseA } })
      const before = await links()

      const [x, y] = await Promise.all([collect(code.deviceCode), collect(code.deviceCode)])
      expect([x.statusCode, y.statusCode].sort()).toEqual([200, 201])
      expect(await links()).toBe(before + 1)
    })

    it("answers 'expired' for a code the server never issued, 400 for a malformed one", async () => {
      const unknown = randomBytes(32).toString("base64url")
      expect((await collect(unknown)).json().data).toEqual({ status: "expired" })
      expect((await collect("short")).statusCode).toBe(400)
    })

    it("refuses an expired code at both ends", async () => {
      const code = await start()
      await prisma.excelDeviceCode.update({
        where: { deviceCodeHash: hashToken(code.deviceCode) },
        data: { expiresAt: new Date(Date.now() - 1000) },
      })
      expect((await approve("teacherA", courseA, code.userCode)).statusCode).toBe(404)
      expect((await collect(code.deviceCode)).json().data).toEqual({ status: "expired" })
    })
  })

  describe("approving a code (ST-XL-03)", () => {
    it("refuses a wrong code, ADMIN, a stranger to the course, and a second approval", async () => {
      expect((await approve("teacherA", courseA, "ABCD-2345")).statusCode).toBe(404)

      const code = await start()
      // ADMIN sees the course but does no teaching work (D-1).
      expect((await approve("admin", courseA, code.userCode)).statusCode).toBe(403)
      // Another course's instructor learns nothing about course A.
      expect((await approve("teacherB", courseA, code.userCode)).statusCode).toBe(404)
      expect((await collect(code.deviceCode)).json().data).toMatchObject({ status: "pending" })

      expect((await approve("teacherA", courseA, code.userCode)).statusCode).toBe(201)
      // A code is approved once: nobody can re-point it at another course or user.
      expect((await approve("teacherB", courseB, code.userCode)).statusCode).toBe(404)
      expect((await approve("teacherA", courseA, code.userCode)).statusCode).toBe(404)
    })

    it("takes the course from the path only (A-8) and needs a signed-in user", async () => {
      const code = await start()
      const body = { userCode: code.userCode, courseId: courseB }
      expect(
        (await call("teacherA", "POST", `/courses/${courseA}/excel-links`, body)).statusCode,
      ).toBe(400)
      expect(
        (await call(null, "POST", `/courses/${courseA}/excel-links`, { userCode: code.userCode }))
          .statusCode,
      ).toBe(401)
      expect((await collect(code.deviceCode)).json().data).toMatchObject({ status: "pending" })
    })

    it("accepts the code as a person types it", async () => {
      const code = await start()
      const typed = ` ${code.userCode.toLowerCase().replace("-", " ")} `
      expect((await approve("teacherA", courseA, typed)).statusCode).toBe(201)
    })
  })

  describe("what a token may do (ST-XL-02)", () => {
    let token: string

    beforeAll(async () => {
      token = (await connect("teacherA", courseA)).token
    })

    it("reads and writes the scores of its own course, as the instructor who approved it", async () => {
      expect((await asAddin(token, "GET", `/courses/${courseA}/scores`)).statusCode).toBe(200)

      const put = await asAddin(token, "PUT", `/courses/${courseA}/scores`, {
        scores: [{ studentId: student, activityId: activity, score: 15, from: null }],
      })
      expect(put.statusCode).toBe(200)

      const row = await prisma.score.findUniqueOrThrow({
        where: { studentId_activityId: { studentId: student, activityId: activity } },
      })
      expect(row.score).toBe(15)
      // A-12: the write is in the history, in the instructor's name.
      const change = await prisma.scoreChange.findFirstOrThrow({
        where: { studentId: student, activityId: activity },
      })
      // …labelled EXCEL by the server, not by the add-in (0012).
      expect(change).toMatchObject({
        toScore: 15,
        changedBy: f.users.teacherA.id,
        source: "EXCEL",
      })
    })

    it("meets the same conflict rule as the web page: a stale 'from' is a 409, nothing is written (D-3)", async () => {
      const stale = await asAddin(token, "PUT", `/courses/${courseA}/scores`, {
        scores: [{ studentId: student, activityId: activity, score: 3, from: null }],
      })
      expect(stale.statusCode).toBe(409)
      const row = await prisma.score.findUniqueOrThrow({
        where: { studentId_activityId: { studentId: student, activityId: activity } },
      })
      expect(row.score).toBe(15)
    })

    it("gets 404 on another course, with the body a missing course gets (A-13)", async () => {
      const foreign = await asAddin(token, "GET", `/courses/${courseB}/scores`)
      const missing = await asAddin(token, "GET", `/courses/${UNUSED_ID}/scores`)
      expect(foreign.statusCode).toBe(404)
      expect(foreign.body).toBe(missing.body)
      expect((await asAddin(token, "PUT", `/courses/${courseB}/scores`, {})).statusCode).toBe(404)
    })

    it("gets 404 on everything else in its own course, and course A survives", async () => {
      const refused: [Method, string, object?][] = [
        ["POST", `/courses/${courseA}/students`, { studentCode: "6699", name: "x" }],
        ["GET", `/courses/${courseA}/scores/template`],
        ["PATCH", `/courses/${courseA}`, { name: "x" }],
        ["DELETE", `/courses/${courseA}`],
        // A token must not be a way to hand the course to someone else.
        ["POST", `/courses/${courseA}/instructors`, { userId: f.users.teacherB.id }],
      ]
      for (const [method, url, body] of refused) {
        expect((await asAddin(token, method, url, body)).statusCode, `${method} ${url}`).toBe(404)
      }
      expect(await prisma.course.count({ where: { id: courseA } })).toBe(1)
      expect(await prisma.student.count({ where: { courseId: courseA } })).toBe(1)
      expect(
        await prisma.courseInstructor.count({
          where: { courseId: courseA, userId: f.users.teacherB.id },
        }),
      ).toBe(0)
    })

    it("gets 404 on signed-in routes: the profile, the course list, the links", async () => {
      for (const [method, url] of [
        ["GET", "/auth/me"],
        ["GET", "/courses"],
        ["GET", "/excel/links"],
        ["GET", "/excel/addin/file"],
      ] as const) {
        expect((await asAddin(token, method, url)).statusCode, `${method} ${url}`).toBe(404)
      }
    })

    it("cannot approve the next code, even for its own course", async () => {
      const code = await start()
      const res = await asAddin(token, "POST", `/courses/${courseA}/excel-links`, {
        userCode: code.userCode,
      })
      expect(res.statusCode).toBe(404)
      expect((await collect(code.deviceCode)).json().data).toMatchObject({ status: "pending" })
    })

    it("records when it was last used", async () => {
      const { token: fresh, linkId } = await connect("teacherA", courseA)
      expect(
        (await prisma.excelLink.findUniqueOrThrow({ where: { id: linkId } })).lastUsedAt,
      ).toBeNull()
      await asAddin(fresh, "GET", `/courses/${courseA}/scores`)
      expect(
        (await prisma.excelLink.findUniqueOrThrow({ where: { id: linkId } })).lastUsedAt,
      ).not.toBeNull()
    })
  })

  describe("two-way sync: the revision and the history label (FR-76, 0012)", () => {
    let token: string
    const revisionOf = async (id: string) =>
      (await prisma.course.findUniqueOrThrow({ where: { id }, select: { revision: true } }))
        .revision

    beforeAll(async () => {
      token = (await connect("teacherA", courseA)).token
    })

    it("moves after a write from the web page and after one from Excel, never after a read", async () => {
      const r0 = await revisionOf(courseA)
      await call("teacherA", "GET", `/courses/${courseA}/scores`)
      await asAddin(token, "GET", `/courses/${courseA}/scores`)
      expect(await revisionOf(courseA)).toBe(r0)

      await call("teacherA", "POST", `/courses/${courseA}/students`, {
        studentCode: "6602",
        name: "นักศึกษา ข",
      })
      const r1 = await revisionOf(courseA)
      expect(r1).toBeGreaterThan(r0)

      const current = await prisma.score.findUnique({
        where: { studentId_activityId: { studentId: student, activityId: activity } },
      })
      await asAddin(token, "PUT", `/courses/${courseA}/scores`, {
        scores: [
          { studentId: student, activityId: activity, score: 11, from: current?.score ?? null },
        ],
      })
      expect(await revisionOf(courseA)).toBeGreaterThan(r1)
    })

    it("does not move after a refused write", async () => {
      const r0 = await revisionOf(courseA)
      const refused = await asAddin(token, "PUT", `/courses/${courseA}/scores`, {
        scores: [{ studentId: student, activityId: activity, score: 99, from: null }],
      })
      expect([409, 422]).toContain(refused.statusCode)
      expect(await revisionOf(courseA)).toBe(r0)
    })

    it("does not move Course.updatedAt, which means 'settings changed'", async () => {
      const before = await prisma.course.findUniqueOrThrow({ where: { id: courseA } })
      await call("teacherA", "POST", `/courses/${courseA}/students`, {
        studentCode: "6603",
        name: "นักศึกษา ค",
      })
      const after = await prisma.course.findUniqueOrThrow({ where: { id: courseA } })
      expect(after.revision).toBeGreaterThan(before.revision)
      expect(after.updatedAt.getTime()).toBe(before.updatedAt.getTime())
    })

    it("is readable by the add-in for its own course only", async () => {
      const own = await asAddin(token, "GET", `/courses/${courseA}/revision`)
      expect(own.statusCode).toBe(200)
      expect(own.headers["cache-control"]).toBe("no-store")
      expect(own.json().data).toEqual({ revision: await revisionOf(courseA) })
      expect((await asAddin(token, "GET", `/courses/${courseB}/revision`)).statusCode).toBe(404)
      expect((await call("teacherB", "GET", `/courses/${courseA}/revision`)).statusCode).toBe(404)
    })

    it("labels Excel writes EXCEL whatever the body claims, and web writes as sent", async () => {
      const at = async () =>
        (
          await prisma.score.findUnique({
            where: { studentId_activityId: { studentId: student, activityId: activity } },
          })
        )?.score ?? null
      const latest = () =>
        prisma.scoreChange.findFirstOrThrow({
          where: { studentId: student, activityId: activity },
          orderBy: { changedAt: "desc" },
        })

      await asAddin(token, "PUT", `/courses/${courseA}/scores`, {
        scores: [{ studentId: student, activityId: activity, score: 12, from: await at() }],
        source: "PASTE",
      })
      expect((await latest()).source).toBe("EXCEL")

      await call("teacherA", "PUT", `/courses/${courseA}/scores`, {
        scores: [{ studentId: student, activityId: activity, score: 13, from: await at() }],
        source: "PASTE",
      })
      expect((await latest()).source).toBe("PASTE")
    })

    it("refuses EXCEL as a source from the web page (the label cannot be forged)", async () => {
      const res = await call("teacherA", "PUT", `/courses/${courseA}/scores`, {
        scores: [{ studentId: student, activityId: activity, score: 14, from: 13 }],
        source: "EXCEL",
      })
      expect(res.statusCode).toBe(400)
    })
  })

  describe("the live checks on every request (FR-74)", () => {
    it("stops at once when the link is revoked", async () => {
      const { token, linkId } = await connect("teacherA", courseA)
      expect((await asAddin(token, "GET", `/courses/${courseA}/scores`)).statusCode).toBe(200)
      expect((await call("teacherA", "DELETE", `/excel/links/${linkId}`)).statusCode).toBe(200)
      expect((await asAddin(token, "GET", `/courses/${courseA}/scores`)).statusCode).toBe(401)
    })

    it("stops when the 8 hours are up", async () => {
      const { token, linkId } = await connect("teacherA", courseA)
      await prisma.excelLink.update({
        where: { id: linkId },
        data: { expiresAt: new Date(Date.now() - 1000) },
      })
      expect((await asAddin(token, "GET", `/courses/${courseA}/scores`)).statusCode).toBe(401)
    })

    it("stops when the account is switched off, and resumes if it is switched back on", async () => {
      const { token } = await connect("teacherA", courseA)
      const where = { id: f.users.teacherA.id }
      await prisma.user.update({ where, data: { isActive: false } })
      try {
        expect((await asAddin(token, "GET", `/courses/${courseA}/scores`)).statusCode).toBe(401)
      } finally {
        await prisma.user.update({ where, data: { isActive: true } })
      }
      expect((await asAddin(token, "GET", `/courses/${courseA}/scores`)).statusCode).toBe(200)
    })

    it("stops when the instructor is taken off the course: the token never outlives that", async () => {
      const own = (await call("teacherA", "POST", "/courses", courseBody("TEST-XL-C"))).json().data
        .id
      const { token } = await connect("teacherA", own)
      expect((await asAddin(token, "GET", `/courses/${own}/scores`)).statusCode).toBe(200)

      await prisma.courseInstructor.deleteMany({
        where: { courseId: own, userId: f.users.teacherA.id },
      })
      expect((await asAddin(token, "GET", `/courses/${own}/scores`)).statusCode).toBe(404)
    })
  })

  describe("listing and cutting connections (ST-XL-04)", () => {
    it("lists only the caller's own live links, with nothing secret", async () => {
      const { linkId } = await connect("teacherA", courseA)
      const mine = (await call("teacherA", "GET", "/excel/links")).json().data as Record<
        string,
        unknown
      >[]
      const row = mine.find((l) => l.id === linkId)
      expect(row).toBeDefined()
      expect(Object.keys(row!).sort()).toEqual([
        "course",
        "createdAt",
        "expiresAt",
        "id",
        "lastUsedAt",
      ])
      expect(row).toMatchObject({ course: { id: courseA, code: "TEST-XL-A" } })

      const theirs = (await call("teacherB", "GET", "/excel/links")).json().data as { id: string }[]
      expect(theirs.some((l) => l.id === linkId)).toBe(false)
    })

    it("does not list a revoked or expired link", async () => {
      const a = await connect("teacherA", courseA)
      const b = await connect("teacherA", courseA)
      await call("teacherA", "DELETE", `/excel/links/${a.linkId}`)
      await prisma.excelLink.update({ where: { id: b.linkId }, data: { expiresAt: new Date(0) } })
      const ids = (
        (await call("teacherA", "GET", "/excel/links")).json().data as { id: string }[]
      ).map((l) => l.id)
      expect(ids).not.toContain(a.linkId)
      expect(ids).not.toContain(b.linkId)
    })

    it("lets nobody cut someone else's link, and says no more than for a missing one", async () => {
      const { token, linkId } = await connect("teacherA", courseA)
      const foreign = await call("teacherB", "DELETE", `/excel/links/${linkId}`)
      const missing = await call("teacherB", "DELETE", `/excel/links/${UNUSED_ID}`)
      expect(foreign.statusCode).toBe(404)
      expect(foreign.body).toBe(missing.body)
      // …and it still works.
      expect((await asAddin(token, "GET", `/courses/${courseA}/scores`)).statusCode).toBe(200)
      expect((await call("teacherA", "DELETE", `/excel/links/${linkId}`)).statusCode).toBe(200)
      // Cutting twice is a 404, not a second success.
      expect((await call("teacherA", "DELETE", `/excel/links/${linkId}`)).statusCode).toBe(404)
    })
  })

  describe("downloading the add-in (FR-75, ST-XL-05)", () => {
    it("hands a signed-in user exactly the file whose SHA-256 the release publishes", async () => {
      const release = (await call(null, "GET", "/excel/addin")).json().data as { sha256: string }
      const res = await call("teacherA", "GET", "/excel/addin/file")
      expect(res.statusCode).toBe(200)
      expect(res.headers["content-type"]).toBe("application/vnd.ms-excel.addin.macroEnabled.12")
      expect(res.headers["content-disposition"]).toContain('filename="CMAS.xlam"')
      expect(createHash("sha256").update(res.rawPayload).digest("hex")).toBe(release.sha256)
    })

    it("needs a sign-in", async () => {
      expect((await call(null, "GET", "/excel/addin/file")).statusCode).toBe(401)
    })
  })

  describe("downloading the score workbook (FR-75, ST-XL-05)", () => {
    it("says whether the workbook can be downloaded", async () => {
      const data = (await call(null, "GET", "/excel/addin")).json().data as {
        workbook: { version: string; available: boolean }
      }
      expect(data.workbook).toEqual({
        version: WORKBOOK_RELEASE.version,
        available: WORKBOOK_RELEASE.sha256 !== null,
      })
    })

    it.skipIf(WORKBOOK_RELEASE.sha256 !== null)(
      "is a 404 with a reason while no template is published, and makes no ticket",
      async () => {
        const before = await prisma.excelDeviceCode.count()
        const res = await call("teacherA", "GET", `/courses/${courseA}/excel-workbook`)
        expect(res.statusCode).toBe(404)
        expect(res.json().message).toContain("ไฟล์กรอกคะแนน")
        expect(await prisma.excelDeviceCode.count()).toBe(before)
      },
    )

    it("needs a sign-in, and is a 404 for a course the caller cannot see", async () => {
      expect((await call(null, "GET", `/courses/${courseA}/excel-workbook`)).statusCode).toBe(401)
      const foreign = await call("teacherB", "GET", `/courses/${courseA}/excel-workbook`)
      const missing = await call("teacherB", "GET", `/courses/${UNUSED_ID}/excel-workbook`)
      expect(foreign.statusCode).toBe(404)
      expect(foreign.body).toBe(missing.body)
    })
  })

  describe("the rules the database itself keeps (0011)", () => {
    const row = (
      extra: Pick<Prisma.ExcelDeviceCodeUncheckedCreateInput, "userCode"> &
        Partial<Prisma.ExcelDeviceCodeUncheckedCreateInput>,
    ): Prisma.ExcelDeviceCodeUncheckedCreateInput => ({
      deviceCodeHash: randomBytes(32).toString("hex"),
      expiresAt: new Date(Date.now() + 60_000),
      ...extra,
    })

    it("accepts a well-formed code (so the refusals below are the rules, not a typo)", async () => {
      made.push("KKKK2222")
      await prisma.excelDeviceCode.create({ data: row({ userCode: "KKKK2222" }) })
    })

    it("refuses a half-approved code: approvedAt, userId and courseId go together", async () => {
      await expect(
        prisma.excelDeviceCode.create({
          data: row({ userCode: "KKKK3333", approvedAt: new Date() }),
        }),
      ).rejects.toThrow()
      await expect(
        prisma.excelDeviceCode.create({
          data: row({ userCode: "KKKK4444", userId: f.users.teacherA.id, courseId: courseA }),
        }),
      ).rejects.toThrow()
    })

    it("refuses a code collected before it was approved", async () => {
      await expect(
        prisma.excelDeviceCode.create({
          data: row({ userCode: "KKKK5555", consumedAt: new Date() }),
        }),
      ).rejects.toThrow()
    })

    it("refuses a user code outside the alphabet (no 0, O, 1, I) or of the wrong length", async () => {
      for (const userCode of [
        "KKKK0000",
        "KKKKOOOO",
        "KKKK1111",
        "KKKKIIII",
        "kkkk2222",
        "KKKK222",
      ]) {
        await expect(
          prisma.excelDeviceCode.create({ data: row({ userCode }) }),
          userCode,
        ).rejects.toThrow()
      }
    })

    it("removes a course's links with the course", async () => {
      const own = (await call("teacherA", "POST", "/courses", courseBody("TEST-XL-D"))).json().data
        .id
      const { linkId } = await connect("teacherA", own)
      await prisma.course.delete({ where: { id: own } })
      expect(await prisma.excelLink.count({ where: { id: linkId } })).toBe(0)
    })

    it("has row-level security on, like every table since 0009 (S-13)", async () => {
      const rows = await prisma.$queryRaw<{ relname: string; relrowsecurity: boolean }[]>`
        SELECT relname, relrowsecurity FROM pg_class
         WHERE relname IN ('ExcelDeviceCode', 'ExcelLink') AND relkind = 'r'
           AND relnamespace = 'public'::regnamespace`
      expect(rows.map((r) => r.relname).sort()).toEqual(["ExcelDeviceCode", "ExcelLink"])
      expect(rows.every((r) => r.relrowsecurity)).toBe(true)
    })
  })

  describe("rate limits (S-5)", () => {
    it("stops the 11th request for a code from one address", async () => {
      const send = () =>
        f.call(null, { method: "POST", url: "/api/v1/excel/device", remoteAddress: "10.99.0.1" })
      const statuses: number[] = []
      for (let i = 0; i < 11; i++) {
        const res = await send()
        statuses.push(res.statusCode)
        if (res.statusCode === 201) made.push((res.json().data.userCode as string).replace("-", ""))
      }
      expect(statuses.slice(0, 10).every((s) => s === 201)).toBe(true)
      expect(statuses[10]).toBe(429)
    })

    it("stops the 11th guess at a code from one address", async () => {
      const guess = () =>
        f.call("teacherA", {
          method: "POST",
          url: `/api/v1/courses/${courseA}/excel-links`,
          payload: { userCode: "ABCD-2345" },
          remoteAddress: "10.99.0.2",
        })
      const statuses: number[] = []
      for (let i = 0; i < 11; i++) statuses.push((await guess()).statusCode)
      expect(statuses.slice(0, 10).every((s) => s === 404)).toBe(true)
      expect(statuses[10]).toBe(429)
    })
  })
})
