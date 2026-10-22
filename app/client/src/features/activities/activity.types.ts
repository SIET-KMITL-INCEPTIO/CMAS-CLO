/** GET /courses/:courseId/activities — ActivityService.toDto. F2 reads only what the step bar needs. */
export type Activity = {
  id: string
  name: string
  type: string
  weight: number
  maxScore: number
  order: number
  /** Enrolled students with a row (a score or EXCUSED) for this activity. */
  scoredCount: number
  studentCount: number
}

/** GET /courses/:courseId/criteria — the activity × objective matrix (design #39). */
export type Criteria = {
  objectives: { id: string; cloId: string; label: string; weight: number | null }[]
  activities: { id: string; name: string; weight: number }[]
  cells: { activityId: string; objectiveId: string; weight: number }[]
}

export type CriteriaMeta = {
  activityWeightSums: Record<string, number>
  cloWeights: Record<string, { computed: number; planned: number | null }>
  unlinkedActivityIds: string[]
  unmeasuredObjectiveIds: string[]
  objectiveWeightSums: Record<string, number>
  totalWeight: number
  isReadyForDashboard: boolean
}
