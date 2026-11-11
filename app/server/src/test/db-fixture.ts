/**
 * Shared setup for the *.db.test.ts files: they run against a real, migrated
 * database and only when CMAS_DB_TESTS=1 (the unit suite never needs one).
 *
 * Everything a test makes is marked so cleanup can find it without touching
 * real data: accounts end in @cmas.test, courses have a code starting TEST-.
 * Cleanup deletes the courses first (cascading to everything under them),
 * then the accounts — the order the Restrict relations on User require.
 */
import type { FastifyInstance, InjectOptions } from "fastify"
import { randomUUID } from "node:crypto"
import { buildApp } from "../app.js"
import { prisma } from "../db/prisma.js"
import { signAccessToken } from "../lib/jwt.js"

export const RUN_DB_TESTS = process.env.CMAS_DB_TESTS === "1"
export const TEST_DOMAIN = "@cmas.test"
export const TEST_CODE = "TEST-"
/** Well-formed cuid that names no row. */
export const UNUSED_ID = "cl00000000000000000000000"

type Who = "admin" | "teacherA" | "teacherB" | "teacherC"

type InjectResponse = Awaited<ReturnType<FastifyInstance["inject"]>>

export type Fixture = {
  app: FastifyInstance
  users: Record<Who, { id: string; bearer: string }>
  call: (who: Who | null, opts: InjectOptions) => Promise<InjectResponse>
  close: () => Promise<void>
}

const ROLE: Record<Who, "ADMIN" | "INSTRUCTOR"> = {
  admin: "ADMIN",
  teacherA: "INSTRUCTOR",
  teacherB: "INSTRUCTOR",
  teacherC: "INSTRUCTOR",
}

export async function cleanTestData() {
  await prisma.course.deleteMany({ where: { code: { startsWith: TEST_CODE } } })
  await prisma.user.deleteMany({ where: { email: { endsWith: TEST_DOMAIN } } })
}

export async function setupFixture(): Promise<Fixture> {
  await cleanTestData() // a run that crashed last time leaves rows behind
  const app = await buildApp({ logger: false })
  const tag = randomUUID().slice(0, 8)

  const users = {} as Fixture["users"]
  for (const who of Object.keys(ROLE) as Who[]) {
    const user = await prisma.user.create({
      data: {
        email: `${who.toLowerCase()}-${tag}${TEST_DOMAIN}`,
        name: `TEST ${who}`,
        role: ROLE[who],
        authProvider: "GOOGLE",
        googleSub: `test-${who}-${tag}`,
        emailVerifiedAt: new Date(),
      },
      select: { id: true },
    })
    users[who] = {
      id: user.id,
      bearer: `Bearer ${await signAccessToken({ sub: user.id, role: ROLE[who] })}`,
    }
  }

  return {
    app,
    users,
    call: (who, opts) =>
      app.inject({
        ...opts,
        headers: { ...(opts.headers ?? {}), ...(who ? { authorization: users[who].bearer } : {}) },
      }),
    close: async () => {
      await app.close()
      await cleanTestData()
    },
  }
}

/** A minimal valid POST /courses body; `code` must start with TEST-. */
export const courseBody = (code: string, extra: Record<string, unknown> = {}) => ({
  code,
  name: "รายวิชาทดสอบ",
  semester: 1,
  year: 2569,
  ...extra,
})
