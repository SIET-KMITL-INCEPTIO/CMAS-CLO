/**
 * Idempotent development seed.
 *
 *   npm run db:seed
 *   SEED_PASSWORD=... npm run db:seed
 *
 * Safe to re-run: every write is an upsert keyed on the schema's natural unique
 * constraints, so running it twice produces the same rows rather than
 * duplicates. Intended for local/dev databases only — it refuses to run when
 * NODE_ENV=production.
 *
 * Single-tenant (2026-08-04): the Institution/Curriculum layer is gone, and
 * with it the SEED_MULTI_TENANT adversarial second institution. The remaining
 * boundary is the course, so the seed creates TWO courses with DIFFERENT
 * instructors — that is what the FR-25 / NFR-07 access tests need: an
 * instructor assigned to course A must get 404 on course B.
 */
import { PrismaClient, Role, CourseRole, GradingType } from "@prisma/client"
import argon2 from "argon2"

const prisma = new PrismaClient()

const SEED_PASSWORD = process.env.SEED_PASSWORD ?? "ChangeMe!2026"

type CourseSpec = {
  code: string
  name: string
  nameEn: string
  semester?: number
  year?: number
  gradingType?: GradingType
  credits?: number
  lectureHours?: number
  practiceHours?: number
  selfStudyHours?: number
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to seed a production database. Unset NODE_ENV=production to proceed.")
  }

  // --- Users -------------------------------------------------------------
  const admin = await upsertUser("admin@cmas.local", "ผู้ดูแลระบบ", Role.ADMIN)
  const lead = await upsertUser(
    "instructor1@cmas.local",
    "อาจารย์ผู้ประสานงานรายวิชา",
    Role.INSTRUCTOR,
  )
  const coInstructor = await upsertUser(
    "instructor2@cmas.local",
    "อาจารย์ผู้สอนร่วม",
    Role.INSTRUCTOR,
  )
  // Teaches the OTHER course only. Every course-scope test needs someone who
  // is a legitimate instructor yet must still be refused course A.
  const outsider = await upsertUser("instructor3@cmas.local", "อาจารย์วิชาอื่น", Role.INSTRUCTOR)

  // --- Course A: the fully populated one ---------------------------------
  const course = await seedCourse({
    code: "90641001",
    name: "การพัฒนาระบบสารสนเทศ",
    nameEn: "Information System Development",
    credits: 3,
    lectureHours: 2,
    practiceHours: 2,
    selfStudyHours: 5,
  })

  for (const [user, role] of [
    [lead, CourseRole.LEAD],
    [coInstructor, CourseRole.CO],
  ] as const) {
    await prisma.courseInstructor.upsert({
      where: { courseId_userId: { courseId: course.id, userId: user.id } },
      update: { role },
      create: { courseId: course.id, userId: user.id, role },
    })
  }

  // --- Course B: PASS_FAIL, different instructor, zero credits -----------
  // 90641008 is the real 0 (0-0-45) prerequisite that FR-14 exists for, and
  // it is graded ผ่าน/ไม่ผ่าน — so CR-06 has something to run against.
  const otherCourse = await seedCourse({
    code: "90641008",
    name: "การเตรียมความพร้อมสหกิจศึกษา",
    nameEn: "Cooperative Education Preparation",
    gradingType: GradingType.PASS_FAIL,
    credits: 0,
    lectureHours: 0,
    practiceHours: 0,
    selfStudyHours: 45,
  })

  await prisma.courseInstructor.upsert({
    where: { courseId_userId: { courseId: otherCourse.id, userId: outsider.id } },
    update: { role: CourseRole.LEAD },
    create: { courseId: otherCourse.id, userId: outsider.id, role: CourseRole.LEAD },
  })

  console.log("Seed complete:")
  console.table({
    users: 4,
    courses: 2,
    "course A (LETTER)": `90641001 — ${lead.email}, ${coInstructor.email}`,
    "course B (PASS_FAIL)": `90641008 — ${outsider.email}`,
  })
  console.log(`\nSign in as ${admin.email} — password: ${SEED_PASSWORD}`)
  console.log("Override the password with SEED_PASSWORD=... npm run db:seed\n")
}

async function upsertUser(email: string, name: string, role: Role) {
  return prisma.user.upsert({
    where: { email },
    update: { role },
    create: { email, name, role, passwordHash: await argon2.hash(SEED_PASSWORD) },
  })
}

/**
 * One course's full vertical slice: course -> CLOs -> behavioural objectives
 * -> activities -> criteria -> students -> scores.
 *
 * The third student is deliberately below threshold so the at-risk path
 * (FR-83 / H2) has data the moment the dashboard exists.
 */
async function seedCourse(spec: CourseSpec) {
  const year = spec.year ?? 2568
  const semester = spec.semester ?? 1

  const course = await prisma.course.upsert({
    where: {
      code_semester_year_section: { code: spec.code, semester, year, section: "01" },
    },
    update: {},
    create: {
      code: spec.code,
      name: spec.name,
      nameEn: spec.nameEn,
      semester,
      year,
      section: "01",
      credits: spec.credits ?? 3,
      lectureHours: spec.lectureHours ?? 0,
      practiceHours: spec.practiceHours ?? 0,
      selfStudyHours: spec.selfStudyHours ?? 0,
      gradingType: spec.gradingType ?? GradingType.LETTER,
      passCriteria: 60,
      classTarget: 70,
    },
  })

  // --- CLOs + behavioural objectives ------------------------------------
  const cloSpecs = [
    { number: 1, description: "อธิบายหลักการวิเคราะห์และออกแบบระบบได้", threshold: 60 },
    { number: 2, description: "ออกแบบฐานข้อมูลเชิงสัมพันธ์ให้อยู่ในรูปนอร์มัลได้", threshold: 60 },
    { number: 3, description: "พัฒนาเว็บแอปพลิเคชันตามข้อกำหนดที่ได้รับได้", threshold: 70 },
  ]

  const clos = []
  for (const cloSpec of cloSpecs) {
    const clo = await prisma.cLO.upsert({
      where: { courseId_number: { courseId: course.id, number: cloSpec.number } },
      update: { description: cloSpec.description, threshold: cloSpec.threshold },
      create: { courseId: course.id, ...cloSpec },
    })
    clos.push(clo)

    await prisma.behavioralObjective.upsert({
      where: { cloId_number: { cloId: clo.id, number: 1 } },
      update: {},
      create: {
        cloId: clo.id,
        number: 1,
        description: `จุดประสงค์เชิงพฤติกรรมข้อที่ 1 ของ CLO ${cloSpec.number}`,
      },
    })
  }

  // --- Activities + criteria (weights sum to 100) -----------------------
  const activitySpecs = [
    { name: "สอบกลางภาค", method: "ข้อสอบอัตนัย", maxScore: 30, order: 1, weight: 30 },
    { name: "งานปฏิบัติการ", method: "ประเมินชิ้นงาน", maxScore: 30, order: 2, weight: 30 },
    { name: "สอบปลายภาค", method: "ข้อสอบอัตนัย", maxScore: 40, order: 3, weight: 40 },
  ]

  const activities = []
  for (const activitySpec of activitySpecs) {
    // Activity has no natural unique key in the schema, so find-then-create
    // rather than upsert keeps this idempotent.
    const existing = await prisma.activity.findFirst({
      where: { courseId: course.id, name: activitySpec.name },
    })
    const activity =
      existing ?? (await prisma.activity.create({ data: { courseId: course.id, ...activitySpec } }))
    activities.push(activity)
  }

  // Map each activity to one CLO at full weight — the simplest mapping that
  // still exercises the attainment computation.
  for (const [index, activity] of activities.entries()) {
    const clo = clos[index]
    if (!clo) continue
    await prisma.assessmentCriteria.upsert({
      where: { activityId_cloId: { activityId: activity.id, cloId: clo.id } },
      update: { weight: 100 },
      create: { activityId: activity.id, cloId: clo.id, weight: 100 },
    })
  }

  // --- Students + scores -------------------------------------------------
  const studentSpecs = [
    { studentCode: "67030098", name: "นักศึกษาตัวอย่าง หนึ่ง", ratio: 0.9 },
    { studentCode: "67030110", name: "นักศึกษาตัวอย่าง สอง", ratio: 0.65 },
    { studentCode: "67030120", name: "นักศึกษาตัวอย่าง สาม", ratio: 0.4 }, // at-risk
  ]

  for (const studentSpec of studentSpecs) {
    const student = await prisma.student.upsert({
      where: {
        studentCode_courseId: { studentCode: studentSpec.studentCode, courseId: course.id },
      },
      update: { name: studentSpec.name },
      create: {
        studentCode: studentSpec.studentCode,
        name: studentSpec.name,
        courseId: course.id,
      },
    })

    // The LAST activity is left ungraded on purpose: FR-62 / CR-03 must treat
    // "no row" as ยังไม่ประเมิน, not as 0. A seed where every cell is filled
    // would never exercise that path.
    for (const activity of activities.slice(0, -1)) {
      const score = Math.round(activity.maxScore * studentSpec.ratio * 100) / 100
      await prisma.score.upsert({
        where: { studentId_activityId: { studentId: student.id, activityId: activity.id } },
        update: { score },
        create: { studentId: student.id, activityId: activity.id, score },
      })
    }
  }

  return course
}

main()
  .catch((error) => {
    console.error("Seed failed:", error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
