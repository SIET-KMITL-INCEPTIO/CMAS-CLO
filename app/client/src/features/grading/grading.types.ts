export type GradeScale = "LETTER" | "PASS_FAIL"
export type GradeMethod = "CRITERION_REFERENCED" | "NORM_REFERENCED"

export type Band = { grade: string; minValue: number }

/** GET /courses/:courseId/grading — GradingService.get. */
export type GradingBand = Band & {
  /** Upper edge: the next band's floor; the top band ends at 100 (percent) or is open (T-score). */
  maxValue: number | null
  /** Students whose issued (or live) grade is this one. */
  count: number
  isPassFloor: boolean
  isFail: boolean
}

export type GradingStudent = {
  studentId: string
  studentCode: string
  name: string
  status: "ENROLLED" | "WITHDRAWN"
  totalPercent: number | null
  /** Every counted activity has a row for this student (CR-05). */
  complete: boolean
  tScore: number | null
  /** What the ladder gives for today's scores; "W" for a withdrawn student. */
  derivedGrade: string | null
  /** What was frozen by "ประมวลผลเกรด", possibly overridden. */
  issuedGrade: string | null
  overrideReason: string | null
}

export type Grading = {
  gradeScale: GradeScale
  gradeMethod: GradeMethod
  passCriteria: number
  /** LADDER: the lowest passing band is the pass mark; MANUAL: the instructor types it. */
  passCriteriaSource: "LADDER" | "MANUAL"
  bands: GradingBand[]
  frozen: boolean
  students: GradingStudent[]
  stats: { n: number; mean: number | null; sd: number | null }
  meta: { warnings: string[] }
}

export type BandsBody = {
  gradeScale?: GradeScale
  gradeMethod?: GradeMethod
  passCriteria?: number
  bands: Band[]
}
