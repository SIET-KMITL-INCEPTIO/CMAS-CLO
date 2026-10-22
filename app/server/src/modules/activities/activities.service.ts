import { BusinessRuleError, ConflictError, NotFoundError } from "../../lib/errors.js"
import { computedCloWeights, groupKey, near, round2, sumBy } from "../../lib/weights.js"
import type { ActivityRepository, ActivityRow } from "./activity.repository.js"
import type {
  ActivityType,
  CreateActivityInput,
  CriteriaInput,
  GroupWeightsInput,
  Method,
  UpdateActivityInput,
} from "./activities.validator.js"

/** Design #35: the method an activity type is usually assessed by (index-q.html 4.2). */
const DEFAULT_METHOD: Record<Exclude<ActivityType, "CUSTOM">, Method> = {
  TEST: "EXAM",
  LAB: "RUBRIC",
  LECTURE: "RUBRIC",
  PROJECT: "WORK",
  OTHER: "OTHER",
}

type DeleteResult = { deleted: true } | { deleted: false; impact: Record<string, number> }

const ACTIVITY_NOT_FOUND = "ไม่พบกิจกรรม"

export class ActivityService {
  constructor(private readonly activities: ActivityRepository) {}

  private toDto(a: ActivityRow, extra: { scoredCount: number; studentCount: number }) {
    const { courseId: _courseId, ...rest } = a
    return {
      ...rest,
      // M3: a pass score never entered reads as the pass mark applied to maxScore.
      passScore: a.passScore ?? round2((a.passMark * a.maxScore) / 100),
      ...extra,
    }
  }

  /** Design #34. */
  async list(courseId: string) {
    const { activities, course, enrolled, scoredBy } = await this.activities.list(courseId)
    const totalWeight = round2(activities.reduce((s, a) => s + a.weight, 0))
    const custom = (key: (a: ActivityRow) => string, when: (a: ActivityRow) => boolean) => [
      ...new Set(activities.filter(when).map(key)),
    ]
    return {
      data: activities.map((a) =>
        this.toDto(a, { scoredCount: scoredBy.get(a.id) ?? 0, studentCount: enrolled }),
      ),
      meta: {
        totalWeight,
        isWeightComplete: near(totalWeight, 100),
        weightMode: course.weightMode,
        groupWeights: Object.fromEntries(course.groupWeights.map((g) => [g.type, g.weight])),
        customTypes: custom(
          (a) => a.typeLabel,
          (a) => a.type === "CUSTOM",
        ),
        customMethods: custom(
          (a) => a.assessmentLabel,
          (a) => a.assessmentMethod === "CUSTOM",
        ),
      },
    }
  }

  private async single(id: string) {
    const a = await this.activities.findById(id)
    if (!a) throw new NotFoundError(ACTIVITY_NOT_FOUND)
    return a
  }

  private async withTotal(courseId: string, a: ActivityRow) {
    const totalWeight = round2(await this.activities.otherWeights(courseId))
    return {
      data: this.toDto(a, { scoredCount: 0, studentCount: 0 }),
      meta: { totalWeight, isWeightComplete: near(totalWeight, 100) },
    }
  }

  /**
   * FR-43 (2569-10-19): below 100 saves with a warning; above 100 is refused
   * with the room that is left, so the instructor knows what to type.
   */
  private async assertTotal(courseId: string, weight: number, exceptId?: string) {
    const others = round2(await this.activities.otherWeights(courseId, exceptId))
    if (others + weight > 100 + 0.005) {
      throw new BusinessRuleError(
        `กิจกรรมอื่นรวม ${others}% แล้ว — ใส่ได้ไม่เกิน ${round2(Math.max(0, 100 - others))}%`,
      )
    }
  }

  /** Design #35: method follows the type unless sent; a known custom type keeps its saved method. */
  private async defaultMethod(courseId: string, type: ActivityType, typeLabel?: string) {
    if (type !== "CUSTOM") return { assessmentMethod: DEFAULT_METHOD[type], assessmentLabel: "" }
    const last = typeLabel ? await this.activities.lastForCustomType(courseId, typeLabel) : null
    return last ?? { assessmentMethod: "OTHER" as Method, assessmentLabel: "" }
  }

  async create(courseId: string, input: CreateActivityInput) {
    const mode = await this.activities.weightMode(courseId)
    if (mode === "GROUP" && input.weight !== undefined) {
      throw new BusinessRuleError("รายวิชานี้กรอกน้ำหนักรายกลุ่ม — แก้น้ำหนักที่กลุ่มแทน")
    }
    const weight = mode === "GROUP" ? 0 : (input.weight ?? 0)
    await this.assertTotal(courseId, weight)

    const orders = await this.activities.orders(courseId)
    if (input.order !== undefined && orders.some((o) => o.order === input.order)) {
      throw new ConflictError("ลำดับนี้มีกิจกรรมอยู่แล้ว")
    }
    const order = input.order ?? Math.max(-1, ...orders.map((o) => o.order)) + 1

    const method = input.assessmentMethod
      ? { assessmentMethod: input.assessmentMethod, assessmentLabel: input.assessmentLabel ?? "" }
      : await this.defaultMethod(courseId, input.type, input.typeLabel)
    const passScore = input.passScore ?? round2(input.maxScore / 2)

    const created = await this.activities.create({
      courseId,
      name: input.name,
      type: input.type,
      typeLabel: input.typeLabel ?? "",
      ...method,
      criteriaNote: input.criteriaNote,
      maxScore: input.maxScore,
      passScore,
      passMark: round2((passScore / input.maxScore) * 100),
      weight,
      order,
    })
    return this.withTotal(courseId, created)
  }

  /** Design #37. */
  async update(activityId: string, courseId: string, input: UpdateActivityInput) {
    const current = await this.single(activityId)
    const mode = await this.activities.weightMode(courseId)
    if (mode === "GROUP" && input.weight !== undefined) {
      throw new BusinessRuleError("รายวิชานี้กรอกน้ำหนักรายกลุ่ม — แก้น้ำหนักที่กลุ่มแทน")
    }
    if (input.weight !== undefined) await this.assertTotal(courseId, input.weight, activityId)

    const type = input.type ?? current.type
    const typeLabel = type === "CUSTOM" ? (input.typeLabel ?? current.typeLabel) : ""
    if (type === "CUSTOM" && !typeLabel) throw new BusinessRuleError("ประเภทที่กำหนดเองต้องมีชื่อ")

    let method: { assessmentMethod: Method; assessmentLabel: string }
    if (input.assessmentMethod) {
      method = {
        assessmentMethod: input.assessmentMethod,
        assessmentLabel: input.assessmentLabel ?? "",
      }
    } else if (input.type && input.type !== current.type) {
      method = await this.defaultMethod(courseId, type, typeLabel)
    } else {
      method = {
        assessmentMethod: current.assessmentMethod,
        assessmentLabel: input.assessmentLabel ?? current.assessmentLabel,
      }
    }
    if (method.assessmentMethod === "CUSTOM" && !method.assessmentLabel) {
      throw new BusinessRuleError("วิธีประเมินที่กำหนดเองต้องมีชื่อ")
    }

    const maxScore = input.maxScore ?? current.maxScore
    // NFR-12: refuse before the trigger does, and say which scores are in the way. Never round them (Q5).
    if (input.maxScore !== undefined && input.maxScore < current.maxScore) {
      const above = await this.activities.countScoresAbove(activityId, maxScore)
      if (above > 0) {
        const { _max } = await this.activities.maxExistingScore(activityId)
        throw new BusinessRuleError(
          `มี ${above} คะแนนสูงกว่าคะแนนเต็มใหม่ — แก้คะแนนเหล่านั้นก่อน`,
          {
            conflictingScores: above,
            maxExistingScore: _max.score,
          },
        )
      }
    }
    const passScore = input.passScore ?? current.passScore
    if (passScore !== null && passScore > maxScore) {
      throw new BusinessRuleError("คะแนนผ่านต้องไม่เกินคะแนนเต็ม")
    }

    const updated = await this.activities.update(activityId, courseId, {
      ...input,
      typeLabel,
      ...method,
      ...(passScore !== null ? { passMark: round2((passScore / maxScore) * 100) } : {}),
    })
    return this.withTotal(courseId, updated)
  }

  /** Design #38: scores go with the activity, so they must be acknowledged first. */
  async remove(activityId: string, courseId: string, confirm: boolean): Promise<DeleteResult> {
    const scores = await this.activities.countScores(activityId)
    if (scores > 0 && !confirm) return { deleted: false, impact: { scores } }
    await this.activities.delete(activityId, courseId)
    return { deleted: true }
  }

  /** Design #36: the list must be exactly this course's activities, each once. */
  async reorder(courseId: string, order: string[]) {
    const ids = new Set((await this.activities.orders(courseId)).map((o) => o.id))
    if (order.length !== ids.size || !order.every((id) => ids.has(id))) {
      throw new BusinessRuleError("ลำดับต้องมีกิจกรรมของรายวิชานี้ครบทุกรายการ รายการละครั้ง")
    }
    await this.activities.reorder(order)
    return this.list(courseId)
  }

  async duplicate(activityId: string, courseId: string) {
    const source = await this.single(activityId)
    const orders = await this.activities.orders(courseId)
    const copy = await this.activities.duplicate(
      source,
      Math.max(-1, ...orders.map((o) => o.order)) + 1,
    )
    return this.withTotal(courseId, copy)
  }

  // ── criteria matrix ──

  /** Design #39: the whole matrix and every number the "ตรวจการเชื่อม" page shows. */
  async criteria(courseId: string) {
    const [objectives, activities, cells, clos] = await this.activities.matrix(courseId)
    const cloOfObjective = new Map(objectives.map((o) => [o.id, o.cloId]))
    const computed = computedCloWeights(activities, cells, cloOfObjective)
    const activityWeightSums = sumBy(
      cells,
      (c) => c.activityId,
      (c) => c.weight,
    )
    const objectiveWeightSums = sumBy(
      objectives,
      (o) => o.cloId,
      (o) => o.weight ?? 0,
    )
    const measured = new Set(cells.map((c) => c.objectiveId))
    const unlinkedActivityIds = activities
      .filter((a) => !activityWeightSums.has(a.id))
      .map((a) => a.id)
    const unmeasuredObjectiveIds = objectives.filter((o) => !measured.has(o.id)).map((o) => o.id)
    const totalWeight = round2(activities.reduce((s, a) => s + a.weight, 0))

    const isReadyForDashboard =
      activities.length > 0 &&
      near(totalWeight, 100) &&
      [...activityWeightSums.values()].every((s) => near(s, 100)) &&
      unlinkedActivityIds.length === 0 &&
      clos.every((c) => near(objectiveWeightSums.get(c.id) ?? 0, 100))

    return {
      data: {
        objectives: objectives.map((o) => ({
          id: o.id,
          cloId: o.cloId,
          label: `${o.clo.number}.${o.number}`,
          weight: o.weight,
        })),
        activities,
        cells,
      },
      meta: {
        activityWeightSums: Object.fromEntries(activityWeightSums),
        cloShares: Object.fromEntries(computed),
        cloWeights: Object.fromEntries(
          clos.map((c) => [c.id, { computed: computed.get(c.id) ?? 0, planned: c.weight }]),
        ),
        unlinkedActivityIds,
        unmeasuredObjectiveIds,
        objectiveWeightSums: Object.fromEntries(objectiveWeightSums),
        totalWeight,
        isReadyForDashboard,
      },
    }
  }

  /** Design #40 · FR-46: every cell must stay inside this course — checked here, before the trigger. */
  async replaceCriteria(courseId: string, input: CriteriaInput) {
    const [objectives, activities] = await this.activities.matrix(courseId)
    const objectiveIds = new Set(objectives.map((o) => o.id))
    const activityIds = new Set(activities.map((a) => a.id))
    if (
      !input.cells.every((c) => activityIds.has(c.activityId) && objectiveIds.has(c.objectiveId))
    ) {
      throw new BusinessRuleError("มีกิจกรรมหรือจุดประสงค์ที่ไม่ใช่ของรายวิชานี้")
    }
    await this.activities.replaceMatrix(courseId, input.cells)
    const result = await this.criteria(courseId)
    // FR-45: off-100 activities save with a warning and are blocked only at the dashboard.
    const warnings = Object.entries(result.meta.activityWeightSums)
      .filter(([, sum]) => !near(sum, 100))
      .map(([activityId, sum]) => ({ activityId, sum }))
    return { data: result.data, meta: { ...result.meta, warnings } }
  }

  // ── group weights · close / reopen ──

  /** Design #42. */
  async setGroupWeights(courseId: string, input: GroupWeightsInput) {
    const weights = input.weights ?? {}
    if (input.mode === "GROUP") {
      const groups = new Set((await this.activities.groupInputs(courseId)).map(groupKey))
      const unknown = Object.keys(weights).filter((k) => !groups.has(k))
      if (unknown.length) {
        throw new BusinessRuleError(`ไม่มีกิจกรรมในกลุ่ม: ${unknown.join(", ")}`)
      }
      const sum = round2(Object.values(weights).reduce((s, w) => s + w, 0))
      if (sum > 100 + 0.005) throw new BusinessRuleError(`น้ำหนักกลุ่มรวม ${sum}% เกิน 100%`)
    }
    const activities = await this.activities.setWeightMode(courseId, input.mode, weights)
    return { mode: input.mode, weights, activities }
  }

  /** Design #43. */
  async close(
    activityId: string,
    courseId: string,
    blank: "ZERO" | "EXCUSED" | "LATER",
    reason: string | undefined,
    actorId: string,
  ) {
    const a = await this.single(activityId)
    if (a.closedAt) throw new BusinessRuleError("กิจกรรมนี้ปิดรับคะแนนแล้ว")
    return this.activities.close(activityId, courseId, blank, reason ?? null, actorId)
  }

  /** Design #44: the zeros and excusals set at closing stay. */
  async reopen(activityId: string) {
    const a = await this.single(activityId)
    if (!a.closedAt) throw new BusinessRuleError("กิจกรรมนี้ยังไม่ได้ปิดรับคะแนน")
    await this.activities.reopen(activityId)
    return { closedAt: null }
  }
}
