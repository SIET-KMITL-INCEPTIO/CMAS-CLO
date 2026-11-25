/**
 * G4: rows read for many courses at once, split back into one CourseData per
 * course — the same shape and order CourseDataRepository.load() gives for one,
 * so lib/attainment.ts cannot tell the two apart (FR-88).
 *
 * Pure, so the split is tested without a database. Rows that know their course
 * (CLOs, activities, students) carry `courseId`; the rest find it through their
 * CLO (objectives) or their activity (criteria cells, scores).
 */
import type {
  ActivityIn,
  CellIn,
  CloIn,
  CourseData,
  CourseIn,
  ObjectiveIn,
  ScoreIn,
  StudentIn,
} from "../lib/attainment.js"

type Owned<T> = T & { courseId: string }

export type ManyCourseRows = {
  courses: (CourseIn & { id: string })[]
  clos: Owned<CloIn>[]
  objectives: ObjectiveIn[]
  activities: Owned<ActivityIn>[]
  cells: CellIn[]
  students: Owned<StudentIn>[]
  scores: ScoreIn[]
}

const strip = <T>({ courseId: _, ...row }: Owned<T>) => row as T

/** One CourseData per course in `courseIds` that exists, in that order; rows keep the order they came in. */
export function groupByCourse(courseIds: string[], rows: ManyCourseRows): Map<string, CourseData> {
  const out = new Map<string, CourseData>()
  const byId = new Map(rows.courses.map((c) => [c.id, c]))
  for (const id of courseIds) {
    const course = byId.get(id)
    if (course)
      out.set(id, {
        course,
        clos: [],
        objectives: [],
        activities: [],
        cells: [],
        students: [],
        scores: [],
      })
  }
  const courseOfClo = new Map(rows.clos.map((c) => [c.id, c.courseId]))
  const courseOfActivity = new Map(rows.activities.map((a) => [a.id, a.courseId]))
  const into = (courseId: string | undefined) => (courseId ? out.get(courseId) : undefined)

  for (const c of rows.clos) into(c.courseId)?.clos.push(strip(c))
  for (const o of rows.objectives) into(courseOfClo.get(o.cloId))?.objectives.push(o)
  for (const a of rows.activities) into(a.courseId)?.activities.push(strip(a))
  for (const c of rows.cells) into(courseOfActivity.get(c.activityId))?.cells.push(c)
  for (const s of rows.students) into(s.courseId)?.students.push(strip(s))
  for (const s of rows.scores) into(courseOfActivity.get(s.activityId))?.scores.push(s)
  return out
}
