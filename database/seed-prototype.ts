/**
 * The four demo courses of docs/pages/index-q.html (`db.course` c1–c4), so the
 * app opens on the same data the prototype shows: CLOs, objectives,
 * activities, the activity → objective mapping, rosters, scores and grade bands.
 *
 * The prototype's people are kept, but on @cmas.local addresses: a seeded
 * account with a known password must never share an address with a real
 * faculty account that could later sign in with Google (@kmitl.ac.th).
 *
 * Idempotent by replacement: each course is upserted on its natural key and
 * its contents are deleted and written again, so a re-run gives the same
 * rows — and also throws away any edits made to these four courses.
 */
import {
  ActivityType,
  AssessmentMethod,
  BloomLevel,
  GradeScale,
  GradingMethod,
  LevelSource,
  type Prisma,
  SoloLevel,
} from "@prisma/client"

type Clo = {
  weight: number
  bloom: BloomLevel | null
  solo: SoloLevel | null
  source?: LevelSource
  text: string
  /** [weight within the CLO, description] */
  objectives: [number, string][]
}
type Act = {
  name: string
  type: ActivityType
  method: AssessmentMethod
  max: number
  pass: number
  weight: number
  note?: string
  closedAt?: string
  /** objective key "CLO.objective" → % of this activity that measures it */
  measures: Record<string, number>
}
type Spec = {
  code: string
  name: string
  nameEn: string
  section: string
  credits: number
  hours: [number, number, number]
  gradeScale: GradeScale
  gradeMethod: GradingMethod
  passCriteria: number
  cloPassMark: number
  clos: Clo[]
  activities: Act[]
  /** [studentCode, name, scores per activity — null = ยังไม่ประเมิน (no row)] */
  students: [string, string, (number | null)[]][]
  bands: [string, number][]
  staff: string[]
  withdrawn?: Record<string, string>
  excused?: { student: string; activity: number; reason: string }[]
}

const { UNDERSTAND, APPLY, ANALYZE, CREATE, EVALUATE } = BloomLevel
const { SURFACE, DEEP, TRANSFER } = SoloLevel
const LETTER_BANDS: [string, number][] = [
  ["A", 80],
  ["B+", 75],
  ["B", 70],
  ["C+", 65],
  ["C", 60],
  ["D+", 55],
  ["D", 50],
  ["F", 0],
]

const C1_NAMES = [
  "กชกร วงศ์อารีย์",
  "ธนกฤต บุญมาก",
  "ปิยะดา แสนสุข",
  "ณัฐวุฒิ พงษ์ไพร",
  "อารยา ทองแท้",
  "สหรัฐ เกษมสุข",
  "มนัสนันท์ ใจงาม",
  "ภาคิน รุ่งเรือง",
  "ชนากานต์ ดีพร้อม",
  "วรินทร ศรีสมบัติ",
  "อนุชา จันทร์เพ็ญ",
  "เบญจวรรณ ปานทอง",
]
const C1_SCORES: (number | null)[][] = [
  [18, 82, 45, 88, 9],
  [14, 71, 38, 74, 8],
  [19, 91, 48, 92, 10],
  [11, 54, 27, 61, 6],
  [16, 76, 41, 80, 9],
  [8, 46, 22, 49, 5],
  [15, 68, 36, 68, 8],
  [12, 59, 31, null, 7],
  [17, 79, 44, 84, 9],
  [0, 38, 19, 42, 4],
  [13, 63, null, 69, 7],
  [15, 66, 28, 60, 8],
]

const ISAD_CLOS: Clo[] = [
  {
    weight: 25,
    bloom: UNDERSTAND,
    solo: SURFACE,
    text: "อธิบายหลักการและวงจรการพัฒนาระบบสารสนเทศได้ถูกต้อง",
    objectives: [
      [40, "ระบุขั้นตอนของ SDLC ได้ครบทั้ง 5 ระยะ"],
      [60, "เปรียบเทียบข้อดีข้อเสียของ Waterfall กับ Agile"],
    ],
  },
  {
    weight: 30,
    bloom: APPLY,
    solo: DEEP,
    text: "ประยุกต์ใช้แผนภาพ UML เพื่อออกแบบโครงสร้างและพฤติกรรมของระบบ",
    objectives: [
      [40, "เขียน Use Case Diagram จากโจทย์ที่กำหนด"],
      [40, "เขียน Class Diagram พร้อมระบุ multiplicity ถูกต้อง"],
      [20, "แปลง Class Diagram เป็นโครงสร้างตารางฐานข้อมูล"],
    ],
  },
  {
    weight: 17,
    bloom: ANALYZE,
    solo: DEEP,
    text: "วิเคราะห์ความต้องการของผู้ใช้และจำแนกเป็นข้อกำหนดเชิงหน้าที่",
    objectives: [
      [50, "จำแนกความต้องการเชิงหน้าที่ออกจากเชิงคุณภาพ"],
      [50, "ตรวจหาความต้องการที่ขัดแย้งกันในเอกสารข้อกำหนด"],
    ],
  },
  {
    weight: 28,
    bloom: CREATE,
    solo: TRANSFER,
    text: "สร้างต้นแบบระบบสารสนเทศที่ตอบข้อกำหนดที่วิเคราะห์ไว้",
    objectives: [
      [40, "ออกแบบส่วนต่อประสานที่สอดคล้องกับ use case หลัก"],
      [60, "สาธิตต้นแบบที่ทำงานได้ครบเส้นทางหลักของผู้ใช้"],
    ],
  },
]

const COURSES: Spec[] = [
  {
    code: "90641003",
    name: "การวิเคราะห์และออกแบบระบบสารสนเทศ",
    nameEn: "Information Systems Analysis and Design",
    section: "01",
    credits: 3,
    hours: [2, 2, 5],
    gradeScale: GradeScale.LETTER,
    gradeMethod: GradingMethod.CRITERION_REFERENCED,
    passCriteria: 60,
    cloPassMark: 60,
    clos: ISAD_CLOS,
    activities: [
      {
        name: "แบบทดสอบย่อย ครั้งที่ 1",
        type: "TEST",
        method: "QUIZ",
        max: 20,
        pass: 12,
        weight: 10,
        note: "ปรนัย ตรวจด้วยเฉลยกลาง",
        closedAt: "2025-07-03",
        measures: { "1.1": 100 },
      },
      {
        name: "สอบกลางภาค",
        type: "TEST",
        method: "EXAM",
        max: 100,
        pass: 50,
        weight: 25,
        note: "อัตนัย ตรวจร่วมกันตามเฉลย",
        closedAt: "2025-08-14",
        measures: { "1.2": 20, "2.1": 20, "2.2": 20, "3.1": 20, "3.2": 20 },
      },
      {
        name: "ปฏิบัติการ UML",
        type: "LAB",
        method: "RUBRIC",
        max: 50,
        pass: 30,
        weight: 20,
        note: "รูบริก 4 ด้าน: ครบถ้วน · ถูกตามสัญลักษณ์ · ตรงโจทย์ · อ่านเข้าใจ",
        closedAt: "2025-08-21",
        measures: { "2.2": 50, "2.3": 50 },
      },
      {
        name: "โครงงานกลุ่ม",
        type: "PROJECT",
        method: "RUBRIC",
        max: 100,
        pass: 60,
        weight: 35,
        note: "รูบริกชิ้นงาน 60 คะแนน + การนำเสนอ 40 คะแนน",
        measures: { "3.2": 20, "4.1": 40, "4.2": 40 },
      },
      {
        name: "การมีส่วนร่วมในชั้นเรียน",
        type: "LECTURE",
        method: "OBSERVATION",
        max: 10,
        pass: 5,
        weight: 10,
        note: "สังเกตการอภิปรายรายสัปดาห์",
        measures: { "1.2": 100 },
      },
    ],
    students: C1_NAMES.map((n, i) => [
      `66041010${String(i + 1).padStart(2, "0")}`,
      n,
      C1_SCORES[i]!,
    ]),
    bands: LETTER_BANDS,
    staff: ["somchai@cmas.local"],
  },
  {
    // FR-27 / DC-15: a real 0-credit prerequisite, graded ผ่าน/ไม่ผ่าน.
    code: "90641008",
    name: "การฝึกปฏิบัติวิชาชีพ",
    nameEn: "Professional Practicum",
    section: "01",
    credits: 0,
    hours: [0, 0, 45],
    gradeScale: GradeScale.PASS_FAIL,
    gradeMethod: GradingMethod.CRITERION_REFERENCED,
    passCriteria: 70,
    cloPassMark: 70,
    clos: [
      {
        weight: 50,
        bloom: APPLY,
        solo: DEEP,
        text: "ปฏิบัติงานในสถานประกอบการตามมาตรฐานวิชาชีพที่กำหนด",
        objectives: [
          [50, "ปฏิบัติตามระเบียบและมาตรฐานความปลอดภัยของสถานประกอบการ"],
          [50, "ส่งมอบงานที่ได้รับมอบหมายภายในกำหนด"],
        ],
      },
      {
        weight: 50,
        bloom: EVALUATE,
        solo: TRANSFER,
        text: "ประเมินผลการปฏิบัติงานของตนเองและเสนอแนวทางพัฒนา",
        objectives: [[100, "วิเคราะห์จุดแข็งจุดอ่อนของตนเองจากบันทึกการปฏิบัติงาน"]],
      },
    ],
    activities: [
      {
        name: "บันทึกการปฏิบัติงานรายสัปดาห์",
        type: "PROJECT",
        method: "WORK",
        max: 30,
        pass: 21,
        weight: 30,
        closedAt: "2025-08-20",
        measures: { "1.1": 50, "1.2": 50 },
      },
      {
        name: "การประเมินโดยพี่เลี้ยง",
        type: "LAB",
        method: "RUBRIC",
        max: 100,
        pass: 70,
        weight: 40,
        note: "แบบประเมินของสถานประกอบการ",
        closedAt: "2025-08-28",
        measures: { "1.1": 25, "1.2": 25, "2.1": 50 },
      },
      {
        name: "รายงานสรุปการฝึกปฏิบัติ",
        type: "PROJECT",
        method: "WORK",
        max: 50,
        pass: 35,
        weight: 30,
        closedAt: "2025-09-05",
        measures: { "2.1": 100 },
      },
    ],
    students: [
      ["6604101003", "ปิยะดา แสนสุข", [27, 84, 43]],
      ["6604101014", "กิตติพงษ์ อยู่เย็น", [24, 76, 38]],
      ["6604101015", "สุพรรษา ทิพย์มณี", [29, 91, 47]],
      ["6604101016", "ณิชากร บัวศรี", [19, 62, 31]],
      ["6604101017", "พงศกร แก้วประเสริฐ", [26, 79, 41]],
      ["6604101018", "ธิดารัตน์ ชูวงศ์", [22, 71, 35]],
      ["6604101019", "อัษฎาวุธ นาคทอง", [17, 58, null]],
      ["6604101020", "ศิริลักษณ์ พูนผล", [28, 88, 45]],
    ],
    bands: [
      ["S", 70],
      ["U", 0],
    ],
    // instructor3 stays the "teaches only another course" account the access tests need.
    staff: ["somchai@cmas.local", "user_th@cmas.local", "instructor3@cmas.local"],
    excused: [
      { student: "6604101019", activity: 2, reason: "ลาป่วยช่วงสัปดาห์สุดท้าย มีใบรับรองแพทย์" },
    ],
  },
  {
    code: "90641005",
    name: "สถิติสำหรับวิศวกรรมซอฟต์แวร์",
    nameEn: "Statistics for Software Engineering",
    section: "01",
    credits: 3,
    hours: [3, 0, 6],
    gradeScale: GradeScale.LETTER,
    gradeMethod: GradingMethod.NORM_REFERENCED,
    passCriteria: 50,
    cloPassMark: 60,
    clos: [
      {
        weight: 30,
        bloom: UNDERSTAND,
        solo: SURFACE,
        text: "อธิบายการแจกแจงความน่าจะเป็นที่ใช้ในงานวิศวกรรมซอฟต์แวร์",
        objectives: [[100, "เลือกการแจกแจงที่เหมาะกับลักษณะข้อมูลที่กำหนด"]],
      },
      {
        weight: 35,
        bloom: APPLY,
        solo: DEEP,
        text: "ประยุกต์การทดสอบสมมติฐานกับข้อมูลการทำงานของระบบ",
        objectives: [[100, "ตั้งสมมติฐานและเลือกสถิติทดสอบได้สอดคล้องกับข้อมูล"]],
      },
      {
        weight: 25,
        bloom: null,
        solo: DEEP,
        source: LevelSource.MANUAL,
        text: "ตีความผลการวิเคราะห์ทางสถิติเพื่อสนับสนุนการตัดสินใจเชิงวิศวกรรม",
        objectives: [[100, "สรุปข้อเสนอเชิงวิศวกรรมจากผลการทดสอบสมมติฐาน"]],
      },
      // Added late with no objective yet — the warning state the prototype shows.
      {
        weight: 10,
        bloom: EVALUATE,
        solo: null,
        source: LevelSource.MANUAL,
        text: "ประเมินความเหมาะสมของวิธีทางสถิติที่เลือกใช้กับปัญหาที่กำหนด",
        objectives: [],
      },
    ],
    activities: [
      {
        name: "แบบทดสอบย่อย",
        type: "TEST",
        method: "QUIZ",
        max: 20,
        pass: 10,
        weight: 15,
        closedAt: "2025-07-10",
        measures: { "1.1": 100 },
      },
      {
        name: "สอบกลางภาค",
        type: "TEST",
        method: "EXAM",
        max: 100,
        pass: 50,
        weight: 30,
        closedAt: "2025-08-15",
        measures: { "1.1": 50, "2.1": 50 },
      },
      // Sums to 80, not 100 — a live mapping error the app has to report (FR-45).
      {
        name: "งานมอบหมายวิเคราะห์ข้อมูล",
        type: "PROJECT",
        method: "WORK",
        max: 40,
        pass: 24,
        weight: 25,
        closedAt: "2025-08-29",
        measures: { "2.1": 50, "3.1": 30 },
      },
      {
        name: "สอบปลายภาค",
        type: "TEST",
        method: "EXAM",
        max: 100,
        pass: 50,
        weight: 30,
        measures: { "2.1": 40, "3.1": 60 },
      },
    ],
    students: [
      ["6604101001", "กชกร วงศ์อารีย์", [17, 78, 33, 81]],
      ["6604101003", "ปิยะดา แสนสุข", [19, 88, 37, 90]],
      ["6604101005", "อารยา ทองแท้", [15, 71, 29, 74]],
      ["6604101021", "ชยพล เรืองฤทธิ์", [12, 58, 24, 61]],
      ["6604101022", "ปวีณา สอนดี", [16, 74, 31, 77]],
      ["6604101023", "นราวิชญ์ พันธุ์ดี", [10, 49, 20, 52]],
      ["6604101024", "จิรัชญา แสงเดือน", [18, 83, 35, 86]],
      ["6604101025", "กันต์ธีร์ วัฒนกุล", [13, 63, 26, 66]],
      ["6604101026", "พิมพ์มาดา อ่อนหวาน", [14, 67, 28, null]],
      ["6604101027", "รัชชานนท์ ภูผา", [9, 44, 18, 47]],
      ["6604101028", "ธนภัทร ศรีวิไล", [7, 36, 14, 39]],
    ],
    // NORM_REFERENCED: the same column is read as a T-score.
    bands: [
      ["A", 65],
      ["B+", 60],
      ["B", 55],
      ["C+", 50],
      ["C", 45],
      ["D+", 40],
      ["D", 35],
      ["F", 0],
    ],
    staff: ["somchai@cmas.local"],
    withdrawn: { "6604101028": "2025-09-03" },
  },
  {
    // Same code as c1, another section — and no roster at all: the empty-course case.
    code: "90641003",
    name: "การวิเคราะห์และออกแบบระบบสารสนเทศ",
    nameEn: "Information Systems Analysis and Design",
    section: "02",
    credits: 3,
    hours: [2, 2, 5],
    gradeScale: GradeScale.LETTER,
    gradeMethod: GradingMethod.CRITERION_REFERENCED,
    passCriteria: 60,
    cloPassMark: 60,
    clos: [],
    activities: [],
    students: [],
    bands: LETTER_BANDS,
    staff: ["user_th@cmas.local"],
  },
]

const SEMESTER = 1
const YEAR = 2568

/** Takes a transaction client too, so a test can run it and roll it back. */
export async function seedPrototype(
  prisma: Prisma.TransactionClient,
  userIdOf: (email: string) => Promise<string>,
) {
  for (const spec of COURSES) {
    const key = { code: spec.code, semester: SEMESTER, year: YEAR, section: spec.section }
    const fields = {
      name: spec.name,
      nameEn: spec.nameEn,
      credits: spec.credits,
      lectureHours: spec.hours[0],
      practiceHours: spec.hours[1],
      selfStudyHours: spec.hours[2],
      gradeScale: spec.gradeScale,
      gradeMethod: spec.gradeMethod,
      passCriteria: spec.passCriteria,
      cloPassMark: spec.cloPassMark,
      classTarget: 100,
    }
    // The course row first: trigger gradeband_passfail reads its gradeScale.
    const course = await prisma.course.upsert({
      where: { code_semester_year_section: key },
      update: fields,
      create: { ...key, ...fields },
    })
    const courseId = course.id

    // Children cascade: scores with students and activities, objectives and criteria with CLOs.
    await prisma.student.deleteMany({ where: { courseId } })
    await prisma.activity.deleteMany({ where: { courseId } })
    await prisma.cLO.deleteMany({ where: { courseId } })
    await prisma.gradeBand.deleteMany({ where: { courseId } })
    await prisma.courseInstructor.deleteMany({ where: { courseId } })

    for (const email of spec.staff) {
      await prisma.courseInstructor.create({ data: { courseId, userId: await userIdOf(email) } })
    }

    const objectiveId = new Map<string, string>()
    for (const [i, clo] of spec.clos.entries()) {
      const row = await prisma.cLO.create({
        data: {
          courseId,
          number: i + 1,
          description: clo.text,
          weight: clo.weight,
          levelSource: clo.source ?? LevelSource.AUTO,
          bloomLevel: clo.bloom,
          soloLevel: clo.solo,
        },
      })
      for (const [j, [weight, description]] of clo.objectives.entries()) {
        const o = await prisma.behavioralObjective.create({
          data: { cloId: row.id, number: j + 1, weight, description },
        })
        objectiveId.set(`${i + 1}.${j + 1}`, o.id)
      }
    }

    const activityIds: string[] = []
    for (const [i, a] of spec.activities.entries()) {
      const row = await prisma.activity.create({
        data: {
          courseId,
          order: i + 1,
          name: a.name,
          type: a.type,
          assessmentMethod: a.method,
          maxScore: a.max,
          passScore: a.pass,
          passMark: Math.round((a.pass / a.max) * 1000) / 10,
          weight: a.weight,
          criteriaNote: a.note ?? "",
          closedAt: a.closedAt ? new Date(a.closedAt) : null,
        },
      })
      activityIds.push(row.id)
      await prisma.assessmentCriteria.createMany({
        data: Object.entries(a.measures).map(([k, weight]) => ({
          activityId: row.id,
          objectiveId: objectiveId.get(k)!,
          weight,
        })),
      })
    }

    for (const [code, name, scores] of spec.students) {
      const withdrawnAt = spec.withdrawn?.[code]
      const s = await prisma.student.create({
        data: {
          courseId,
          studentCode: code,
          name,
          ...(withdrawnAt
            ? { status: "WITHDRAWN" as const, withdrawnAt: new Date(withdrawnAt) }
            : {}),
        },
      })
      const excused = spec.excused?.filter((e) => e.student === code) ?? []
      await prisma.score.createMany({
        data: [
          // null = no row = ยังไม่ประเมิน (FR-62); 0 is a real zero and is stored.
          ...scores.flatMap((v, i) =>
            v === null || excused.some((e) => e.activity === i)
              ? []
              : [{ studentId: s.id, activityId: activityIds[i]!, score: v }],
          ),
          ...excused.map((e) => ({
            studentId: s.id,
            activityId: activityIds[e.activity]!,
            score: null,
            status: "EXCUSED" as const,
            excuseReason: e.reason,
          })),
        ],
      })
    }

    await prisma.gradeBand.createMany({
      data: spec.bands.map(([grade, minValue]) => ({ courseId, grade, minValue })),
    })
  }
  return COURSES.map((c) => `${c.code} Sec ${c.section}`)
}
