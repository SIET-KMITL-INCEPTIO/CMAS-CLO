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
import { PrismaClient, Role, GradeScale, ActivityType, AssessmentMethod } from "@prisma/client"
import argon2 from "argon2"

const prisma = new PrismaClient()

const SEED_PASSWORD = process.env.SEED_PASSWORD ?? "ChangeMe!2026"

type CourseSpec = {
  code: string
  name: string
  nameEn: string
  semester?: number
  year?: number
  gradeScale?: GradeScale
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
  // Two instructors on one course, with equal rights — course roles were
  // removed 2026-09-14 (D1), so the pair exists to prove shared editing works.
  const lead = await upsertUser("instructor1@cmas.local", "อาจารย์ผู้สอน 1", Role.INSTRUCTOR)
  const coInstructor = await upsertUser("instructor2@cmas.local", "อาจารย์ผู้สอน 2", Role.INSTRUCTOR)
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

  for (const user of [lead, coInstructor]) {
    await prisma.courseInstructor.upsert({
      where: { courseId_userId: { courseId: course.id, userId: user.id } },
      update: {},
      create: { courseId: course.id, userId: user.id },
    })
  }

  // --- Course B: PASS_FAIL, different instructor, zero credits -----------
  // 90641008 is the real 0 (0-0-45) prerequisite that FR-14 exists for, and
  // it is graded ผ่าน/ไม่ผ่าน — so CR-06 has something to run against.
  const otherCourse = await seedCourse({
    code: "90641008",
    name: "การเตรียมความพร้อมสหกิจศึกษา",
    nameEn: "Cooperative Education Preparation",
    gradeScale: GradeScale.PASS_FAIL,
    credits: 0,
    lectureHours: 0,
    practiceHours: 0,
    selfStudyHours: 45,
  })

  await prisma.courseInstructor.upsert({
    where: { courseId_userId: { courseId: otherCourse.id, userId: outsider.id } },
    update: {},
    create: { courseId: otherCourse.id, userId: outsider.id },
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
    // Seeded accounts are pre-verified: an unverified account cannot sign in
    // (FR-07), and nobody is going to click a link for a dev seed.
    create: {
      email,
      name,
      role,
      passwordHash: await argon2.hash(SEED_PASSWORD),
      emailVerifiedAt: new Date(),
    },
  })
}

/**
 * One course's full vertical slice: course -> CLOs -> behavioural objectives
 * -> activities -> criteria -> students -> scores.
 *
 * The third student is deliberately below the CLO pass mark so the at-risk path
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
      gradeScale: spec.gradeScale ?? GradeScale.LETTER,
      passCriteria: 60,
      cloPassMark: 60, // E1 — one CLO pass mark for the whole course
      classTarget: 70,
    },
  })

  // --- CLOs + behavioural objectives ------------------------------------
  // CLO weights are entered (T1) and match what the activity mapping below
  // implies (30/30/40), so the two-way weight check starts out green.
  const cloSpecs = [
    { number: 1, description: "อธิบายหลักการวิเคราะห์และออกแบบระบบได้", weight: 30 },
    { number: 2, description: "ออกแบบฐานข้อมูลเชิงสัมพันธ์ให้อยู่ในรูปนอร์มัลได้", weight: 30 },
    { number: 3, description: "พัฒนาเว็บแอปพลิเคชันตามข้อกำหนดที่ได้รับได้", weight: 40 },
  ]

  const objectives = []
  for (const cloSpec of cloSpecs) {
    const clo = await prisma.cLO.upsert({
      where: { courseId_number: { courseId: course.id, number: cloSpec.number } },
      update: { description: cloSpec.description, weight: cloSpec.weight },
      create: { courseId: course.id, ...cloSpec },
    })

    // One objective per CLO, so it carries the whole CLO (weight 100, T6).
    const objective = await prisma.behavioralObjective.upsert({
      where: { cloId_number: { cloId: clo.id, number: 1 } },
      update: { weight: 100 },
      create: {
        cloId: clo.id,
        number: 1,
        weight: 100,
        description: `จุดประสงค์เชิงพฤติกรรมข้อที่ 1 ของ CLO ${cloSpec.number}`,
      },
    })
    objectives.push(objective)
  }

  // --- Activities + criteria (weights sum to 100) -----------------------
  const activitySpecs = [
    { name: "สอบกลางภาค", type: ActivityType.TEST, assessmentMethod: AssessmentMethod.EXAM,
      criteriaNote: "ข้อสอบอัตนัย", passMark: 50, maxScore: 30, order: 1, weight: 30 },
    { name: "งานปฏิบัติการ", type: ActivityType.LAB, assessmentMethod: AssessmentMethod.RUBRIC,
      criteriaNote: "ประเมินชิ้นงานด้วยรูบริก", passMark: 60, maxScore: 30, order: 2, weight: 30 },
    { name: "สอบปลายภาค", type: ActivityType.TEST, assessmentMethod: AssessmentMethod.EXAM,
      criteriaNote: "ข้อสอบอัตนัย", passMark: 50, maxScore: 40, order: 3, weight: 40 },
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

  // Map each activity to one objective at full weight — the simplest mapping
  // that still exercises the attainment computation (T4: activities link to
  // objectives, and reach the CLO through them).
  for (const [index, activity] of activities.entries()) {
    const objective = objectives[index]
    if (!objective) continue
    await prisma.assessmentCriteria.upsert({
      where: { activityId_objectiveId: { activityId: activity.id, objectiveId: objective.id } },
      update: { weight: 100 },
      create: { activityId: activity.id, objectiveId: objective.id, weight: 100 },
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
