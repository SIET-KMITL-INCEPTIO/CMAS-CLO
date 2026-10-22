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
