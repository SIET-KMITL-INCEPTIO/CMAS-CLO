export const BLOOM = ["REMEMBER", "UNDERSTAND", "APPLY", "ANALYZE", "EVALUATE", "CREATE"] as const
export const SOLO = ["SURFACE", "DEEP", "TRANSFER"] as const
export type Bloom = (typeof BLOOM)[number]
export type Solo = (typeof SOLO)[number]

/** GET /courses/:courseId/clos — CloService.toDto. */
export type Clo = {
  id: string
  number: number
  description: string
  /** The weight the instructor plans (E2) — compared with computedWeight, never in a formula. */
  weight: number | null
  levelSource: "AUTO" | "MANUAL"
  bloomLevel: Bloom | null
  soloLevel: Solo | null
  /** CR-02: what the activities actually give this CLO; read-only. */
  computedWeight: number
  objectiveCount: number
  isMeasured: boolean
}

export type CloListMeta = {
  weightSum: number
  weightWarnings: { cloId: string; entered: number; computed: number }[]
  cloPassMark: number
}

export type CloInput = {
  number: number
  description: string
  weight: number | null
  levelSource: "AUTO" | "MANUAL"
  bloomLevel?: Bloom
  soloLevel?: Solo
}

/** GET /clos/:cloId/objectives — CloService.objectiveDto. */
export type Objective = {
  id: string
  cloId: string
  number: number
  description: string
  weight: number | null
  /** "2.1" — CLO number, then objective number. */
  label: string
  activityCount: number
}

export type ObjectiveInput = { number: number; description: string; weight: number }
