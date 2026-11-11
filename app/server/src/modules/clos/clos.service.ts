import { BusinessRuleError, NotFoundError } from "../../lib/errors.js"
import { computedCloWeights, near, round2 } from "../../lib/weights.js"
import type { CloRepository, CloRow, ObjectiveRow } from "./clo.repository.js"
import type {
  CreateCloInput,
  CreateObjectiveInput,
  UpdateCloInput,
  UpdateObjectiveInput,
} from "./clos.validator.js"

type Bloom = NonNullable<CloRow["bloomLevel"]>
type Solo = NonNullable<CloRow["soloLevel"]>

/** O3: the fixed Bloom → SOLO table (same as BLOOM_TO_SOLO in index-q.html). */
export const BLOOM_TO_SOLO: Record<Bloom, Solo> = {
  REMEMBER: "SURFACE",
  UNDERSTAND: "SURFACE",
  APPLY: "DEEP",
  ANALYZE: "DEEP",
  EVALUATE: "TRANSFER",
  CREATE: "TRANSFER",
}

type DeleteResult = { deleted: true } | { deleted: false; impact: Record<string, number> }

export class CloService {
  constructor(private readonly clos: CloRepository) {}

  /**
   * E2: the weight an instructor plans for a CLO is compared with the weight
   * the criteria matrix actually gives it. A mismatch warns, it never blocks.
   */
  private async weights(courseId: string) {
    const input = await this.clos.weightInputs(courseId)
    return {
      computed: computedCloWeights(input.activities, input.cells, input.cloOfObjective),
      cloPassMark: input.cloPassMark,
    }
  }

  private warnings(clos: CloRow[], computed: Map<string, number>) {
    return clos
      .filter((c) => c.weight !== null && !near(c.weight, computed.get(c.id) ?? 0))
      .map((c) => ({ cloId: c.id, entered: c.weight, computed: computed.get(c.id) ?? 0 }))
  }

  private toDto(c: CloRow, computed: Map<string, number>) {
    const { objectives, courseId: _courseId, ...rest } = c
    return {
      ...rest,
      computedWeight: computed.get(c.id) ?? 0, // CR-02: read-only, never accepted from a body
      objectiveCount: objectives.length,
      isMeasured: objectives.some((o) => o._count.criteria > 0),
    }
  }

  /** Design #25. */
  async list(courseId: string) {
    const [clos, { computed, cloPassMark }] = await Promise.all([
      this.clos.listByCourse(courseId),
      this.weights(courseId),
    ])
    return {
      data: clos.map((c) => this.toDto(c, computed)),
      meta: {
        weightSum: round2(clos.reduce((s, c) => s + (c.weight ?? 0), 0)),
        weightWarnings: this.warnings(clos, computed),
        cloPassMark,
      },
    }
  }

  private async withMeta(courseId: string, clo: CloRow) {
    const [{ computed }, all] = await Promise.all([
      this.weights(courseId),
      this.clos.listByCourse(courseId),
    ])
    return {
      data: this.toDto(clo, computed),
      meta: { weightWarnings: this.warnings(all, computed) },
    }
  }

  /** Design #26: AUTO takes SOLO from Bloom. */
  async create(courseId: string, input: CreateCloInput) {
    const soloLevel =
      input.levelSource === "AUTO" ? BLOOM_TO_SOLO[input.bloomLevel] : (input.soloLevel ?? null)
    const clo = await this.clos.create(courseId, { ...input, soloLevel })
    return this.withMeta(courseId, clo)
  }

  /** Design #28: changing Bloom while AUTO moves SOLO with it (O3). */
  async update(cloId: string, courseId: string, input: UpdateCloInput) {
    const current = await this.clos.findById(cloId)
    if (!current) throw new NotFoundError("ไม่พบ CLO")
    const source = input.levelSource ?? current.levelSource
    const bloom = input.bloomLevel ?? current.bloomLevel
    const data: Record<string, unknown> = { ...input }
    if (source === "AUTO") {
      data.soloLevel = bloom ? BLOOM_TO_SOLO[bloom] : null
    } else if ((input.soloLevel ?? current.soloLevel) === null) {
      throw new BusinessRuleError("ระดับ MANUAL ต้องเลือก soloLevel")
    }
    return this.withMeta(courseId, await this.clos.update(cloId, data))
  }

  /** Design #27: the list must be exactly this course's CLOs, each once. */
  async reorder(courseId: string, order: string[]) {
    const clos = await this.clos.listByCourse(courseId)
    const ids = new Set(clos.map((c) => c.id))
    if (order.length !== ids.size || !order.every((id) => ids.has(id))) {
      throw new BusinessRuleError("ลำดับต้องมี CLO ของรายวิชานี้ครบทุกข้อ ข้อละครั้ง")
    }
    await this.clos.renumber(courseId, order)
    return this.list(courseId)
  }

  /** Design #29 · FR-36: a measured CLO is deleted only after the caller has seen what goes with it. */
  async remove(cloId: string, confirm: boolean): Promise<DeleteResult> {
    const impact = await this.clos.deleteImpact(cloId)
    if (impact.criteria > 0 && !confirm) return { deleted: false, impact }
    await this.clos.delete(cloId)
    return { deleted: true }
  }

  // ── objectives (design #30-#33) ──

  private objectiveDto(o: ObjectiveRow) {
    const { clo, criteria, ...rest } = o
    return {
      ...rest,
      label: `${clo.number}.${o.number}`,
      activityCount: new Set(criteria.map((c) => c.activityId)).size,
    }
  }

  /** CR-01: objectives under one CLO sum to 100, or the CLO's result is locked. */
  private async objectiveMeta(cloId: string) {
    const all = await this.clos.listObjectives(cloId)
    const weightSum = round2(all.reduce((s, o) => s + (o.weight ?? 0), 0))
    const warnings =
      all.length > 0 && !near(weightSum, 100)
        ? [`น้ำหนักจุดประสงค์รวม ${weightSum}% ต้องเป็น 100% ผลของ CLO นี้จึงคำนวณได้`]
        : []
    return { all, meta: { weightSum, warnings } }
  }

  async objectives(cloId: string) {
    const { all, meta } = await this.objectiveMeta(cloId)
    return { data: all.map((o) => this.objectiveDto(o)), meta }
  }

  async createObjective(cloId: string, input: CreateObjectiveInput) {
    const created = await this.clos.createObjective(cloId, input)
    return { data: this.objectiveDto(created), meta: (await this.objectiveMeta(cloId)).meta }
  }

  async updateObjective(objectiveId: string, input: UpdateObjectiveInput) {
    const updated = await this.clos.updateObjective(objectiveId, input)
    return {
      data: this.objectiveDto(updated),
      meta: (await this.objectiveMeta(updated.cloId)).meta,
    }
  }

  async removeObjective(objectiveId: string, confirm: boolean): Promise<DeleteResult> {
    const criteria = await this.clos.countObjectiveCriteria(objectiveId)
    if (criteria > 0 && !confirm) return { deleted: false, impact: { criteria } }
    await this.clos.deleteObjective(objectiveId)
    return { deleted: true }
  }
}
