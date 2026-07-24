/**
 * Idempotent development seed.
 *
 *   npm run db:seed
 *
 * Safe to re-run: every write is an upsert keyed on the schema's natural unique
 * constraints, so running it twice produces the same rows rather than
 * duplicates. Intended for local/dev databases only — it refuses to run when
 * NODE_ENV=production.
 */
import { PrismaClient, Role, CourseRole, GradingType } from "@prisma/client"
import argon2 from "argon2"

const prisma = new PrismaClient()

const SEED_PASSWORD = process.env.SEED_PASSWORD ?? "ChangeMe!2026"

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to seed a production database. Unset NODE_ENV=production to proceed.")
  }

  const passwordHash = await argon2.hash(SEED_PASSWORD)

  // --- Users -------------------------------------------------------------
  const admin = await prisma.user.upsert({
    where: { email: "admin@cmas.local" },
    update: {},
    create: {
      email: "admin@cmas.local",
      name: "ผู้ดูแลระบบ",
      passwordHash,
      role: Role.ADMIN,
    },
  })

  const lead = await prisma.user.upsert({
    where: { email: "instructor1@cmas.local" },
    update: {},
    create: {
      email: "instructor1@cmas.local",
      name: "อาจารย์ผู้ประสานงานรายวิชา",
      passwordHash,
      role: Role.INSTRUCTOR,
    },
  })

  const coInstructor = await prisma.user.upsert({
    where: { email: "instructor2@cmas.local" },
    update: {},
    create: {
      email: "instructor2@cmas.local",
      name: "อาจารย์ผู้สอนร่วม",
      passwordHash,
      role: Role.INSTRUCTOR,
    },
  })

  // --- Curriculum (the plan) --------------------------------------------
  const curriculum = await prisma.curriculum.upsert({
    where: {
      institution_name_year: {
        institution: "มหาวิทยาลัยตัวอย่าง",
        name: "หลักสูตรวิศวกรรมซอฟต์แวร์",
        year: 2568,
      },
    },
    update: {},
    create: {
      name: "หลักสูตรวิศวกรรมซอฟต์แวร์",
      year: 2568,
      institution: "มหาวิทยาลัยตัวอย่าง",
    },
  })

  // --- Course (the reality) ---------------------------------------------
  const course = await prisma.course.upsert({
    where: {
      code_semester_year_section: { code: "90641001", semester: 1, year: 2568, section: "01" },
    },
    update: {},
    create: {
      code: "90641001",
      name: "การพัฒนาระบบสารสนเทศ",
      semester: 1,
      year: 2568,
      section: "01",
    },
  })

  await prisma.curriculumCourse.upsert({
    where: {
      curriculumId_courseCode: { curriculumId: curriculum.id, courseCode: "90641001" },
    },
    update: { courseId: course.id },
    create: {
      curriculumId: curriculum.id,
      courseId: course.id,
      courseCode: "90641001",
      courseName: "การพัฒนาระบบสารสนเทศ",
      courseNameEn: "Information System Development",
      credits: 3,
      lectureHours: 2,
      practiceHours: 2,
      selfStudyHours: 5,
      gradingType: GradingType.LETTER,
    },
  })

  // Exactly one LEAD per course — enforced by a partial unique index in the
  // manual migration, and by the application layer.
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

  // --- CLOs + behavioural objectives ------------------------------------
  const cloSpecs = [
    { number: 1, description: "อธิบายหลักการวิเคราะห์และออกแบบระบบได้", threshold: 60 },
    { number: 2, description: "ออกแบบฐานข้อมูลเชิงสัมพันธ์ให้อยู่ในรูปนอร์มัลได้", threshold: 60 },
    { number: 3, description: "พัฒนาเว็บแอปพลิเคชันตามข้อกำหนดที่ได้รับได้", threshold: 70 },
  ]

  const clos = []
  for (const spec of cloSpecs) {
    const clo = await prisma.cLO.upsert({
      where: { courseId_number: { courseId: course.id, number: spec.number } },
      update: { description: spec.description, threshold: spec.threshold },
      create: { courseId: course.id, ...spec },
    })
    clos.push(clo)

    await prisma.behavioralObjective.upsert({
      where: { cloId_number: { cloId: clo.id, number: 1 } },
      update: {},
      create: {
        cloId: clo.id,
        number: 1,
        description: `จุดประสงค์เชิงพฤติกรรมข้อที่ 1 ของ CLO ${spec.number}`,
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
  for (const spec of activitySpecs) {
    // Activity has no natural unique key in the schema, so find-then-create
    // rather than upsert keeps this idempotent.
    const existing = await prisma.activity.findFirst({
      where: { courseId: course.id, name: spec.name },
    })
    const activity =
      existing ?? (await prisma.activity.create({ data: { courseId: course.id, ...spec } }))
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

  for (const spec of studentSpecs) {
    const student = await prisma.student.upsert({
      where: {
        studentCode_courseId: { studentCode: spec.studentCode, courseId: course.id },
      },
      update: { name: spec.name },
      create: { studentCode: spec.studentCode, name: spec.name, courseId: course.id },
    })

    for (const activity of activities) {
      const score = Math.round(activity.maxScore * spec.ratio * 100) / 100
      await prisma.score.upsert({
        where: { studentId_activityId: { studentId: student.id, activityId: activity.id } },
        update: { score },
        create: { studentId: student.id, activityId: activity.id, score },
      })
    }
  }

  console.log("Seed complete:")
  console.table({
    users: 3,
    curriculum: 1,
    courses: 1,
    clos: clos.length,
    activities: activities.length,
    students: studentSpecs.length,
    scores: studentSpecs.length * activities.length,
  })
  console.log(`\nSign in as ${admin.email} — password: ${SEED_PASSWORD}`)
  console.log("Override with SEED_PASSWORD=... npm run db:seed\n")
}

main()
  .catch((error) => {
    console.error("Seed failed:", error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
