import { expect, test } from "@playwright/test"
import { prisma, signInAs } from "../support/session"

/**
 * P4 of the UI/UX plan (docs/markdown/dev/planning/ui-ux-completion-plan.md):
 * the use cases whose screens came last, driven through the built app on the
 * seeded database (course 90641001, term 1/2568, taught by instructor1).
 * Each test names its use case and the system test it stands for.
 */
const ADMIN = "admin@cmas.local"
const INSTRUCTOR = "instructor1@cmas.local"
const SEED_CODE = "90641001"

test.afterAll(async () => {
  await prisma.$disconnect()
})

async function seededCourseId() {
  const c = await prisma.course.findFirstOrThrow({
    where: { code: SEED_CODE, year: 2568 },
    select: { id: true },
  })
  return c.id
}

test("UC 1.1 — an ADMIN adds an account, and a second one with the same email is refused (ST-AUTH-10)", async ({
  page,
}) => {
  const email = `e2e-added-${Date.now()}@cmas.test`
  await signInAs(page, ADMIN)
  await page.goto("/admin/users")

  await page.getByRole("button", { name: "+ เพิ่มบัญชี" }).click()
  const dialog = page.getByRole("dialog", { name: "เพิ่มบัญชีผู้ใช้" })
  await dialog.getByLabel("อีเมล").fill(email.toUpperCase())
  await dialog.getByLabel("ชื่อ-สกุล").fill("E2E เพิ่มบัญชี")
  await dialog.getByRole("button", { name: "เพิ่มบัญชี" }).click()

  await expect(page.getByText("เพิ่มบัญชี E2E เพิ่มบัญชี แล้ว", { exact: false })).toBeVisible()
  const row = await prisma.user.findUniqueOrThrow({ where: { email } }) // stored lower-case
  expect(row).toMatchObject({ status: "ACTIVE", role: "INSTRUCTOR", emailVerifiedAt: null })

  await page.getByRole("button", { name: "+ เพิ่มบัญชี" }).click()
  await dialog.getByLabel("อีเมล").fill(email)
  await dialog.getByLabel("ชื่อ-สกุล").fill("ซ้ำ")
  await dialog.getByRole("button", { name: "เพิ่มบัญชี" }).click()
  await expect(dialog.getByText("มีบัญชีที่ใช้อีเมลนี้แล้ว", { exact: false })).toBeVisible()
  expect(await prisma.user.count({ where: { email } })).toBe(1)
})

test("UC 7.4 and 6.4 — the roster and the score sheet download as Excel (ST-IMP-07)", async ({
  page,
}) => {
  await signInAs(page, INSTRUCTOR)
  await page.goto(`/courses/${await seededCourseId()}/roster`)
  await page.getByRole("button", { name: "Excel", exact: true }).click()

  for (const [group, name] of [
    ["รายชื่อนักศึกษา", /^roster-90641001-01-\d{12}\.xlsx$/],
    ["คะแนน", /\.xlsx$/],
  ] as const) {
    const download = page.waitForEvent("download")
    await page.getByRole("group", { name: group }).getByRole("button", { name: "ส่งออก" }).click()
    expect((await download).suggestedFilename()).toMatch(name)
  }
})

test("UC 5.3 — the overview's histogram is drawn from the server's bins (FR-88)", async ({
  page,
}) => {
  const id = await seededCourseId()
  const summary = page.waitForResponse((r) => r.url().endsWith(`/courses/${id}/dashboard/summary`))
  await signInAs(page, INSTRUCTOR)
  await page.goto(`/courses/${id}`)
  const body = (await (await summary).json()) as {
    data: { course: { distribution: { count: number }[] } }
  }
  expect(body.data.course.distribution).toHaveLength(10)
  await expect(page.getByText("การกระจายคะแนนรวม (คน)")).toBeVisible()
})

test("UC 2.9 — an instructor copies a year level to the next academic year (ST-COURSE-07, 08)", async ({
  page,
}) => {
  await signInAs(page, INSTRUCTOR)
  await page.goto("/courses")
  await page.getByRole("button", { name: "ยกโครงทั้งชั้นปี" }).click()
  const dialog = page.getByRole("dialog", { name: "ยกโครงทั้งชั้นปีไปปีการศึกษาใหม่" })

  // 90641001 is not in the study plan: it is listed off-plan, not ticked.
  await expect(dialog.getByText("นอกแผน", { exact: false })).toBeVisible()
  const box = dialog.getByRole("checkbox", { name: new RegExp(SEED_CODE) })
  await expect(box).not.toBeChecked()
  await box.check()
  await dialog.getByRole("button", { name: /คัดลอกที่เลือก \(1\)/ }).click()

  await expect(
    page.getByText("คัดลอกปี 1 ไปปีการศึกษา 2569 แล้ว 1 รายวิชา", { exact: false }),
  ).toBeVisible()
  const copy = await prisma.course.findFirstOrThrow({
    where: { code: SEED_CODE, year: 2569 },
    include: { students: true, clos: true },
  })
  expect(copy.students).toHaveLength(0)
  expect(copy.clos.length).toBeGreaterThan(0)
})

test("the shortcuts dialog opens with '?' and closes with Esc", async ({ page }) => {
  await signInAs(page, INSTRUCTOR)
  await page.goto("/courses")
  await expect(page.getByText("กำลังโหลด")).toHaveCount(0)
  await page.keyboard.press("?")
  const dialog = page.getByRole("dialog", { name: "แป้นพิมพ์ลัด" })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByText("Ctrl / ⌘ K")).toBeVisible()
  await page.keyboard.press("Escape")
  await expect(dialog).toBeHidden()
})
