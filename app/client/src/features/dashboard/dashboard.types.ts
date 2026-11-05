/** What the server's analysis says about one CLO for one student (CR-03.1: no score is its own state). */
export type CloStatus = "PASS" | "AT_RISK" | "NOT_EVALUATED"

/** GET /courses/:courseId/dashboard/attainment — DashboardService.attainment. */
export type CloAttainment = {
  cloId: string
  number: number
  description: string
  target: number
  /** Share of evaluable students who passed; null = cannot say yet (FR-84), never 0. */
  attainment: number | null
  status: "ACHIEVED" | "NOT_ACHIEVED" | "NOT_EVALUATED"
  passedCount: number
  evaluableCount: number
  atRiskCount: number
  notEvaluatedCount: number
  provisionalCount: number
}
export type Attainment = {
  classTarget: number
  cloPassMark: number
  helpCount: number
  clos: CloAttainment[]
  /** blockers: why nothing can be computed yet, as sentences to show (lib/attainment.ts). */
  meta: { computable: boolean; blockers: string[]; teachingSignals: string[] }
}

/** GET /courses/:courseId/dashboard/at-risk — most serious first (CR-05.1). */
export type AtRiskLevel = "COURSE_FAIL" | "CLO_BELOW" | "OVERDUE"
export type AtRiskRow = {
  studentId: string
  studentCode: string
  name: string
  level: AtRiskLevel
  failedClos: {
    cloId: string
    number: number
    score: number | null
    gap: number | null
    near: boolean
    provisional: boolean
    hasPlan: boolean
  }[]
  overdue: { activityId: string; name: string }[]
  totalScore: number | null
  coursePassed: boolean | null
}
export type AtRisk = {
  rows: AtRiskRow[]
  meta: { atRiskCount: number; notEvaluatedCount: number; evaluatedCount: number }
}

/** GET /courses/:courseId/dashboard/students/:studentId — DashboardService.student. */
export type StudentResult = {
  student: { id: string; studentCode: string; name: string; status: "ENROLLED" | "WITHDRAWN" }
  gradeScale: "LETTER" | "PASS_FAIL"
  clos: {
    cloId: string
    number: number
    description: string
    score: number | null
    passMark: number
    status: CloStatus
    /** Scored, but not every activity that measures it yet. */
    provisional: boolean
    objectives: { objectiveId: string; label: string; weight: number; score: number | null }[]
  }[]
  activities: {
    activityId: string
    name: string
    weight: number
    maxScore: number
    score: number | null
    percent: number | null
    status: "SCORED" | "EXCUSED" | "OVERDUE" | "MISSING"
  }[]
  totalScore: number | null
  coursePassed: boolean | null
  passFailResult: "S" | "U" | null
  grade: string | null
  remediationPlans: { cloId: string; plan: string; updatedAt: string }[]
}

/** GET /courses/:courseId/dashboard/summary — the overview page from one snapshot. */
export type CourseSummary = {
  attainment: { data: Omit<Attainment, "meta">; meta: Attainment["meta"] }
  atRisk: { data: AtRiskRow[]; meta: AtRisk["meta"] }
  course: {
    passCriteria: number
    enrolledCount: number
    /** Students whose every counted activity has a row (CR-05); totals are theirs only. */
    completeCount: number
    passedCount: number
    totals: number[]
  }
  activities: {
    activityId: string
    name: string
    passMark: number
    passCount: number
    failCount: number
    missingCount: number
    averagePercent: number | null
  }[]
}

/** GET /courses/:courseId/dashboard/students — one row per enrolled student. */
export type ClassResultRow = {
  studentId: string
  studentCode: string
  name: string
  clos: { cloId: string; score: number | null; status: CloStatus; provisional: boolean }[]
  totalScore: number | null
}
