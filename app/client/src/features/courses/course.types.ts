/** GET /courses and GET /courses/:courseId — CourseService.toCourseDto on the server. */
export type Course = {
  id: string
  code: string
  name: string
  nameEn: string | null
  semester: number
  year: number
  section: string
  credits: string
  lectureHours: string
  practiceHours: string
  selfStudyHours: string
  gradeScale: "LETTER" | "PASS_FAIL"
  gradeMethod: "CRITERION_REFERENCED" | "NORM_REFERENCED"
  weightMode: "MANUAL" | "GROUP"
  passCriteria: number
  cloPassMark: number
  classTarget: number
  createdAt: string
  updatedAt: string
  counts: { clos: number; activities: number; students: number }
  instructors: { userId: string; name: string }[]
}

export type CourseWithReadiness = Course & {
  /** FR-84: what still stops the course's numbers being computed; empty = ready. */
  readiness: { blockers: string[] }
}

/** The fields the course form sends (POST/PATCH /courses). Grading settings live on the grading page. */
export type CourseInput = {
  code: string
  name: string
  nameEn: string | null
  semester: number
  year: number
  section: string
  credits: number
  lectureHours: number
  practiceHours: number
  selfStudyHours: number
}

/** GET /courses/:courseId/impact — every row DELETE takes with it (FR-26). */
export type CourseImpact = {
  clos: number
  objectives: number
  activities: number
  criteria: number
  students: number
  scores: number
  uploadLogs: number
  remediationPlans: number
}

export type InstructorHit = { id: string; name: string; email: string }
