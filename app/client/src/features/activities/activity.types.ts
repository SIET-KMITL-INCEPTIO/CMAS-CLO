export const ACTIVITY_TYPES = ["LECTURE", "LAB", "TEST", "PROJECT", "OTHER", "CUSTOM"] as const
export const METHODS = ["QUIZ", "EXAM", "RUBRIC", "WORK", "OBSERVATION", "OTHER", "CUSTOM"] as const
export type ActivityKind = (typeof ACTIVITY_TYPES)[number]
export type Method = (typeof METHODS)[number]

/** GET /courses/:courseId/activities — ActivityService.toDto. */
export type Activity = {
  id: string
  name: string
  type: ActivityKind
  typeLabel: string
  assessmentMethod: Method
  assessmentLabel: string
  criteriaNote: string
  weight: number
  maxScore: number
  /** M3: what the instructor typed; passMark is derived from it. */
  passScore: number
  passMark: number
  order: number
  /** Set when the activity stopped taking scores (R3). */
  closedAt: string | null
  /** Enrolled students with a row (a score or EXCUSED) for this activity. */
  scoredCount: number
  studentCount: number
}

export type ActivityListMeta = {
  totalWeight: number
  isWeightComplete: boolean
  weightMode: "MANUAL" | "GROUP"
  /** Keyed by an activity type, or "CUSTOM:<name>". */
  groupWeights: Record<string, number>
  customTypes: string[]
  customMethods: string[]
}

export type ActivityInput = {
  name: string
  type: ActivityKind
  typeLabel?: string
  assessmentMethod?: Method
  assessmentLabel?: string
  maxScore: number
  passScore?: number
  /** Not sent in GROUP mode: the group's weight decides it. */
  weight?: number
  order?: number
}

/** GET /courses/:courseId/criteria — the activity × objective matrix (design #39). */
export type Criteria = {
  objectives: { id: string; cloId: string; label: string; weight: number | null }[]
  activities: { id: string; name: string; weight: number }[]
  cells: Cell[]
}
export type Cell = { activityId: string; objectiveId: string; weight: number }

export type CriteriaMeta = {
  activityWeightSums: Record<string, number>
  cloWeights: Record<string, { computed: number; planned: number | null }>
  unlinkedActivityIds: string[]
  unmeasuredObjectiveIds: string[]
  objectiveWeightSums: Record<string, number>
  totalWeight: number
  isReadyForDashboard: boolean
}
