import { useActivityList, useCriteria } from "../activities/useActivities.ts"
import { useCloList } from "../clos/useClos.ts"
import type { Course } from "./course.types.ts"
import { stepStates } from "./setupSteps.ts"

/** The setup steps' states for this course, or null until the three reads are in. */
export function useSetupSteps(course: Course) {
  const clos = useCloList(course.id)
  const criteria = useCriteria(course.id)
  const activities = useActivityList(course.id)
  if (!clos.data || !criteria.data || !activities.data) return null
  return stepStates({
    clos: clos.data.clos,
    criteria: criteria.data,
    activities: activities.data.activities,
    students: course.counts.students,
  })
}
