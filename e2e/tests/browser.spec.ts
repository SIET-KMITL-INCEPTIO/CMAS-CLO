import { expect, test } from "@playwright/test"
import { prisma, signInAs } from "../support/session"

// Browser → built SPA → built API → Postgres. The pages on main are still
// thin, so this covers what exists: the shell, the login page, and the one
// complete flow, an ADMIN approving a pending Google account (FR-08). Add the
// course flows here once those pages land on main.

const PENDING_EMAIL = "e2e-pending@cmas.test"
const PENDING_NAME = "E2E รออนุมัติ"

test.afterAll(async () => {
  await prisma.$disconnect()
})

test("the app shell and login page render without console errors", async ({ page }) => {
  const errors: string[] = []
  page.on("console", (message) => {
    // index.html links /favicon.ico, which the client doesn't ship yet.
    if (message.location().url.endsWith("/favicon.ico")) return
    if (message.type() === "error") errors.push(message.text())
  })
  page.on("pageerror", (error) => errors.push(error.message))

  await page.goto("/")
  await expect(page.getByRole("heading", { name: "CLO System" })).toBeVisible()

  await page.goto("/auth/login")
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

  const row = page.getByRole("listitem").filter({ hasText: PENDING_EMAIL })
  await expect(row).toBeVisible()
  await row.getByRole("button", { name: "อนุมัติ" }).click()

  await expect(page.getByText(`อนุมัติ ${PENDING_NAME} แล้ว`)).toBeVisible()
  await expect
    .poll(async () => (await prisma.user.findUniqueOrThrow({ where: { id: pending.id } })).status)
    .toBe("ACTIVE")
})
