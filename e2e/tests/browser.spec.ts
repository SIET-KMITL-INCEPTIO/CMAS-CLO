import { expect, test } from "@playwright/test"
import { prisma, signInAs } from "../support/session"

// Browser → built SPA → built API → Postgres: the route guard, the login page,
// and an ADMIN approving a pending Google account (FR-08). Add the course flows
// (create a course, import scores, read attainment) here next.

const PENDING_EMAIL = "e2e-pending@cmas.test"
const PENDING_NAME = "E2E รออนุมัติ"

test.afterAll(async () => {
  await prisma.$disconnect()
})

test("a signed-out visit lands on the login page without console errors", async ({ page }) => {
  const errors: string[] = []
  page.on("console", (message) => {
    const url = message.location().url
    // index.html links /favicon.ico, which the client doesn't ship yet.
    if (url.endsWith("/favicon.ico")) return
    // The app asks POST /auth/refresh on every load; with no cookie that is a 401 by design.
    if (url.endsWith("/auth/refresh")) return
    if (message.type() === "error") errors.push(message.text())
  })
  page.on("pageerror", (error) => errors.push(error.message))

  await page.goto("/")
  await expect(page).toHaveURL(/\/auth\/login$/)
  await expect(page.getByRole("heading", { name: "เข้าสู่ระบบ" })).toBeVisible()

  expect(errors).toEqual([])
})

test("an ADMIN approves a pending Google account", async ({ page }) => {
  // Upsert, not create: a re-run starts from PENDING again.
  const pending = await prisma.user.upsert({
    where: { email: PENDING_EMAIL },
    update: { status: "PENDING", name: PENDING_NAME },
    create: {
      email: PENDING_EMAIL,
      name: PENDING_NAME,
      authProvider: "GOOGLE",
      googleSub: "e2e-pending-google-sub",
      status: "PENDING",
      emailVerifiedAt: new Date(),
    },
  })

  await signInAs(page, "admin@cmas.local")
  await page.goto("/admin/users")

  const row = page.getByRole("row").filter({ hasText: PENDING_EMAIL })
  await expect(row).toBeVisible()
  await row.getByRole("button", { name: "อนุมัติ" }).click()

  await expect(page.getByText(`อนุมัติ ${PENDING_NAME} แล้ว`)).toBeVisible()
  await expect
    .poll(async () => (await prisma.user.findUniqueOrThrow({ where: { id: pending.id } })).status)
    .toBe("ACTIVE")
})
