/** Characterization tests (refactor-plan.md P0): pin CloService's rules today. */
import { describe, expect, it, vi } from "vitest"
import { BusinessRuleError, NotFoundError } from "../../lib/errors.js"
import type { CloRepository } from "./clo.repository.js"
import { BLOOM_TO_SOLO, CloService } from "./clos.service.js"

const clo = (over: Record<string, unknown> = {}) => ({
  id: "c1",
  courseId: "k1",
  number: 1,
  weight: 50 as number | null,
  bloomLevel: "APPLY",
  soloLevel: "DEEP",
  levelSource: "AUTO",
  objectives: [{ _count: { criteria: 2 } }, { _count: { criteria: 0 } }],
  ...over,
})
const objective = (over: Record<string, unknown> = {}) => ({
  id: "o1",
  cloId: "c1",
  number: 1,
  weight: 100 as number | null,
  clo: { number: 1 },
  criteria: [{ activityId: "a1" }, { activityId: "a1" }, { activityId: "a2" }],
  ...over,
})

function setup(over: Record<string, unknown> = {}) {
  const repo = {
    listByCourse: vi.fn(async () => [clo(), clo({ id: "c2", number: 2, weight: null })]),
    weightInputs: vi.fn(async () => ({
      // c1 is measured at exactly 30% of the course, c2 not at all.
      activities: [{ id: "a1", weight: 30 }],
      cells: [{ activityId: "a1", objectiveId: "o1", weight: 100 }],
      cloOfObjective: new Map([["o1", "c1"]]),
      cloPassMark: 60,
    })),
    create: vi.fn(async (_c: string, data: Record<string, unknown>) => clo(data)),
    findById: vi.fn(async () => clo() as ReturnType<typeof clo> | null),
    update: vi.fn(async (_id: string, data: Record<string, unknown>) => clo(data)),
    renumber: vi.fn(async () => {}),
    deleteImpact: vi.fn(async () => ({ criteria: 0 })),
    delete: vi.fn(async () => {}),
    listObjectives: vi.fn(async () => [objective(), objective({ id: "o2", number: 2, weight: 0 })]),
    createObjective: vi.fn(async () => objective()),
    updateObjective: vi.fn(async () => objective()),
    countObjectiveCriteria: vi.fn(async () => 0),
    deleteObjective: vi.fn(async () => {}),
    ...over,
  }
  return { service: new CloService(repo as unknown as CloRepository), repo }
}

describe("BLOOM_TO_SOLO (O3)", () => {
  it("maps the six Bloom levels onto three SOLO levels", () => {
    expect(BLOOM_TO_SOLO).toEqual({
      REMEMBER: "SURFACE",
      UNDERSTAND: "SURFACE",
      APPLY: "DEEP",
      ANALYZE: "DEEP",
      EVALUATE: "TRANSFER",
      CREATE: "TRANSFER",
    })
  })
})

describe("list", () => {
  it("shows the computed weight beside the planned one and warns on a mismatch", async () => {
    const { service } = setup()
    const r = await service.list("k1")
    expect(r.data[0]).toMatchObject({
      computedWeight: 30,
      objectiveCount: 2,
      isMeasured: true,
    })
    expect(r.data[0]).not.toHaveProperty("courseId")
    expect(r.data[1]).toMatchObject({ computedWeight: 0, isMeasured: true })
    // c1 planned 50, measured 30 → warns. c2 has no planned weight → never warns.
    expect(r.meta).toEqual({
      weightSum: 50,
      weightWarnings: [{ cloId: "c1", entered: 50, computed: 30 }],
      cloPassMark: 60,
    })
  })

  it("a CLO whose objectives have no criteria is not measured", async () => {
    const { service } = setup({
      listByCourse: vi.fn(async () => [clo({ objectives: [{ _count: { criteria: 0 } }] })]),
    })
    expect((await service.list("k1")).data[0]!.isMeasured).toBe(false)
  })
})

describe("create", () => {
  it("AUTO takes SOLO from Bloom", async () => {
    const { service, repo } = setup()
    await service.create("k1", { levelSource: "AUTO", bloomLevel: "CREATE" } as never)
    expect(repo.create.mock.calls[0]![1]).toMatchObject({ soloLevel: "TRANSFER" })
  })

  it("MANUAL keeps the SOLO level sent, or null", async () => {
    const { service, repo } = setup()
    await service.create("k1", {
      levelSource: "MANUAL",
      bloomLevel: "CREATE",
      soloLevel: "SURFACE",
    } as never)
    expect(repo.create.mock.calls[0]![1]).toMatchObject({ soloLevel: "SURFACE" })
    await service.create("k1", { levelSource: "MANUAL", bloomLevel: "CREATE" } as never)
    expect(repo.create.mock.calls[1]![1]).toMatchObject({ soloLevel: null })
  })

  it("the response carries weight warnings", async () => {
    const r = await setup().service.create("k1", {
      levelSource: "AUTO",
      bloomLevel: "APPLY",
    } as never)
    expect(r.meta.weightWarnings).toEqual([{ cloId: "c1", entered: 50, computed: 30 }])
  })
})

describe("update", () => {
  it("a missing CLO is a 404", async () => {
    const { service } = setup({ findById: vi.fn(async () => null) })
    await expect(service.update("c1", "k1", {} as never)).rejects.toBeInstanceOf(NotFoundError)
  })

  it("changing Bloom while AUTO moves SOLO with it", async () => {
    const { service, repo } = setup()
    await service.update("c1", "k1", { bloomLevel: "REMEMBER" } as never)
    expect(repo.update).toHaveBeenCalledWith("c1", { bloomLevel: "REMEMBER", soloLevel: "SURFACE" })
  })

  it("AUTO with no Bloom level at all clears SOLO", async () => {
    const { service, repo } = setup({
      findById: vi.fn(async () => clo({ bloomLevel: null })),
    })
    await service.update("c1", "k1", { name: "x" } as never)
    expect(
      (repo.update.mock.calls[0] as unknown as [string, { soloLevel: unknown }])[1].soloLevel,
    ).toBeNull()
  })

  it("MANUAL needs a SOLO level, from the body or already stored", async () => {
    const none = setup({ findById: vi.fn(async () => clo({ soloLevel: null })) })
    await expect(
      none.service.update("c1", "k1", { levelSource: "MANUAL" } as never),
    ).rejects.toBeInstanceOf(BusinessRuleError)
    expect(none.repo.update).not.toHaveBeenCalled()
    const stored = setup()
    await stored.service.update("c1", "k1", { levelSource: "MANUAL" } as never)
    expect(stored.repo.update).toHaveBeenCalledWith("c1", { levelSource: "MANUAL" })
  })
})

describe("reorder", () => {
  it("needs exactly this course's CLOs, each once", async () => {
    const { service, repo } = setup()
    for (const bad of [["c1"], ["c1", "zz"], ["c1", "c2", "c3"]]) {
      await expect(service.reorder("k1", bad)).rejects.toBeInstanceOf(BusinessRuleError)
    }
    expect(repo.renumber).not.toHaveBeenCalled()
    await service.reorder("k1", ["c2", "c1"])
    expect(repo.renumber).toHaveBeenCalledWith("k1", ["c2", "c1"])
  })
})

describe("remove (FR-36)", () => {
  it("a measured CLO is deleted only after confirm", async () => {
    const { service, repo } = setup({ deleteImpact: vi.fn(async () => ({ criteria: 4 })) })
    expect(await service.remove("c1", false)).toEqual({ deleted: false, impact: { criteria: 4 } })
    expect(repo.delete).not.toHaveBeenCalled()
    expect(await service.remove("c1", true)).toEqual({ deleted: true })
  })

  it("an unmeasured one goes at once", async () => {
    expect(await setup().service.remove("c1", false)).toEqual({ deleted: true })
  })
})

describe("objectives", () => {
  it("label them CLO.objective and count the distinct activities that measure each", async () => {
    const r = await setup().service.objectives("c1")
    expect(r.data[0]).toMatchObject({ label: "1.1", activityCount: 2 })
    expect(r.data[0]).not.toHaveProperty("clo")
    expect(r.data[0]).not.toHaveProperty("criteria")
  })

  it("warns while the weights do not make 100 (CR-01), and not when they do", async () => {
    const short = await setup().service.objectives("c1")
    expect(short.meta).toEqual({ weightSum: 100, warnings: [] })
    const off = await setup({
      listObjectives: vi.fn(async () => [objective({ weight: 60 }), objective({ weight: null })]),
    }).service.objectives("c1")
    expect(off.meta.weightSum).toBe(60)
    expect(off.meta.warnings).toEqual([
      "น้ำหนักจุดประสงค์รวม 60% ต้องเป็น 100% ผลของ CLO นี้จึงคำนวณได้",
    ])
  })

  it("a CLO with no objectives yet has no warning", async () => {
    const r = await setup({ listObjectives: vi.fn(async () => []) }).service.objectives("c1")
    expect(r.meta).toEqual({ weightSum: 0, warnings: [] })
  })

  it("create and update return the CLO's meta, update using the objective's own CLO", async () => {
    const { service, repo } = setup()
    expect((await service.createObjective("c1", {} as never)).meta.weightSum).toBe(100)
    repo.updateObjective.mockResolvedValueOnce(objective({ cloId: "c9" }) as never)
    await service.updateObjective("o1", {} as never)
    expect(repo.listObjectives).toHaveBeenLastCalledWith("c9")
  })

  it("removeObjective: measured ones need confirm", async () => {
    const { service, repo } = setup({ countObjectiveCriteria: vi.fn(async () => 2) })
    expect(await service.removeObjective("o1", false)).toEqual({
      deleted: false,
      impact: { criteria: 2 },
    })
    expect(repo.deleteObjective).not.toHaveBeenCalled()
    expect(await service.removeObjective("o1", true)).toEqual({ deleted: true })
    expect(await setup().service.removeObjective("o1", false)).toEqual({ deleted: true })
  })
})

describe("reorder: known gap", () => {
  // The check compares length and membership only, so a repeated id passes when the
  // count happens to match. This test states the intended rule and is expected to fail
  // today (it.fails); when the check is fixed it starts failing, so remove `.fails`.
  it.fails("refuses a list that repeats one CLO and leaves another out", async () => {
    const { service, repo } = setup()
    await expect(service.reorder("k1", ["c1", "c1"])).rejects.toBeInstanceOf(BusinessRuleError)
    expect(repo.renumber).not.toHaveBeenCalled()
  })
})
