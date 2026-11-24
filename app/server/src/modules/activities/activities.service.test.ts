/** Characterization tests (refactor-plan.md P0): pin ActivityService's rules today. */
import { describe, expect, it, vi } from "vitest"
import { BusinessRuleError, ConflictError, NotFoundError } from "../../lib/errors.js"
import type { ActivityRepository } from "./activity.repository.js"
import { ActivityService } from "./activities.service.js"

const activity = (over: Record<string, unknown> = {}) => ({
  id: "a1",
  courseId: "k1",
  name: "Quiz 1",
  type: "TEST",
  typeLabel: "",
  assessmentMethod: "EXAM",
  assessmentLabel: "",
  criteriaNote: null,
  maxScore: 20,
  passScore: null as number | null,
  passMark: 50,
  weight: 30,
  order: 0,
  closedAt: null as Date | null,
  ...over,
})

function setup(over: Record<string, unknown> = {}) {
  const repo = {
    list: vi.fn(async () => ({
      activities: [
        activity(),
        activity({
          id: "a2",
          type: "CUSTOM",
          typeLabel: "สอบปากเปล่า",
          assessmentMethod: "CUSTOM",
          assessmentLabel: "ฟังพูด",
          passScore: 7,
          weight: 20.005,
        }),
      ],
      course: { weightMode: "ACTIVITY", groupWeights: [{ type: "TEST", weight: 30 }] },
      enrolled: 40,
      scoredBy: new Map([["a1", 12]]),
    })),
    findById: vi.fn(async () => activity() as ReturnType<typeof activity> | null),
    otherWeights: vi.fn(async (_c: string, _except?: string) => 40),
    weightMode: vi.fn(async () => "ACTIVITY" as "ACTIVITY" | "GROUP"),
    orders: vi.fn(async () => [
      { id: "a1", order: 0 },
      { id: "a2", order: 4 },
    ]),
    lastForCustomType: vi.fn(async () => null as unknown),
    create: vi.fn(async (data: Record<string, unknown>) => activity(data)),
    update: vi.fn(async (_id: string, _c: string, data: Record<string, unknown>) => activity(data)),
    countScoresAbove: vi.fn(async () => 0),
    maxExistingScore: vi.fn(async () => ({ _max: { score: 18 } })),
    countScores: vi.fn(async () => 0),
    delete: vi.fn(async () => {}),
    reorder: vi.fn(async () => {}),
    duplicate: vi.fn(async (_source: unknown, _order: number) => activity({ id: "copy" })),
    matrix: vi.fn(async () => [
      [
        { id: "o1", cloId: "c1", number: 1, weight: 100, clo: { number: 1 } },
        { id: "o2", cloId: "c2", number: 1, weight: 100, clo: { number: 2 } },
        { id: "o3", cloId: "c2", number: 2, weight: null, clo: { number: 2 } },
      ],
      [
        { id: "a1", weight: 50 },
        { id: "a2", weight: 50 },
      ],
      [
        { activityId: "a1", objectiveId: "o1", weight: 100 },
        { activityId: "a2", objectiveId: "o2", weight: 100 },
      ],
      [
        { id: "c1", weight: 50 },
        { id: "c2", weight: 40 },
      ],
    ]),
    replaceMatrix: vi.fn(async () => {}),
    groupInputs: vi.fn(async () => [
      { type: "TEST", typeLabel: "" },
      { type: "CUSTOM", typeLabel: "สอบปากเปล่า" },
    ]),
    setWeightMode: vi.fn(async () => [{ id: "a1", weight: 30 }]),
    close: vi.fn(async () => ({ closedAt: new Date(0) })),
    reopen: vi.fn(async () => {}),
    ...over,
  }
  return { service: new ActivityService(repo as unknown as ActivityRepository), repo }
}

describe("list", () => {
  it("adds the pass score default, totals the weight and collects custom labels", async () => {
    const { service } = setup()
    const r = await service.list("k1")
    // passScore never entered = passMark% of maxScore.
    expect(r.data.map((a) => a.passScore)).toEqual([10, 7])
    expect(r.data[0]).toMatchObject({ scoredCount: 12, studentCount: 40 })
    expect(r.data[1]).toMatchObject({ scoredCount: 0 })
    expect(r.data[0]).not.toHaveProperty("courseId")
    expect(r.meta).toEqual({
      totalWeight: 50.01,
      isWeightComplete: false,
      weightMode: "ACTIVITY",
      groupWeights: { TEST: 30 },
      customTypes: ["สอบปากเปล่า"],
      customMethods: ["ฟังพูด"],
    })
  })
})

describe("create", () => {
  const input = (over: Record<string, unknown> = {}) =>
    ({ name: "Lab", type: "LAB", maxScore: 10, ...over }) as never

  it("takes the default method of its type, the next free order and half marks to pass", async () => {
    const { service, repo } = setup()
    const r = await service.create("k1", input({ weight: 30 }))
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        assessmentMethod: "RUBRIC",
        assessmentLabel: "",
        order: 5,
        passScore: 5,
        passMark: 50,
        weight: 30,
      }),
    )
    expect(r.meta).toEqual({ totalWeight: 40, isWeightComplete: false })
  })

  it("refuses a weight that would push the total over 100 and names the room left", async () => {
    const { service, repo } = setup()
    await expect(service.create("k1", input({ weight: 61 }))).rejects.toThrow("ใส่ได้ไม่เกิน 60%")
    await service.create("k1", input({ weight: 60 }))
    expect(repo.create).toHaveBeenCalledTimes(1)
  })

  it("an explicit order that is taken is a 409", async () => {
    const { service } = setup()
    await expect(service.create("k1", input({ order: 4 }))).rejects.toBeInstanceOf(ConflictError)
  })

  it("GROUP mode refuses a typed weight and stores 0", async () => {
    const { service, repo } = setup({ weightMode: vi.fn(async () => "GROUP") })
    await expect(service.create("k1", input({ weight: 10 }))).rejects.toThrow("น้ำหนักรายกลุ่ม")
    await service.create("k1", input())
    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ weight: 0 }))
  })

  it("a known custom type keeps the method last used for it; an unknown one is OTHER", async () => {
    const known = setup({
      lastForCustomType: vi.fn(async () => ({ assessmentMethod: "WORK", assessmentLabel: "" })),
    })
    await known.service.create("k1", input({ type: "CUSTOM", typeLabel: "พิเศษ" }))
    expect(known.repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ assessmentMethod: "WORK" }),
    )
    const unknown = setup()
    await unknown.service.create("k1", input({ type: "CUSTOM", typeLabel: "ใหม่" }))
    expect(unknown.repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ assessmentMethod: "OTHER" }),
    )
  })

  it("a method sent wins over the default", async () => {
    const { service, repo } = setup()
    await service.create("k1", input({ assessmentMethod: "CUSTOM", assessmentLabel: "x" }))
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ assessmentMethod: "CUSTOM", assessmentLabel: "x" }),
    )
  })
})

describe("update", () => {
  it("a missing activity is a 404", async () => {
    const { service } = setup({ findById: vi.fn(async () => null) })
    await expect(service.update("a1", "k1", {} as never)).rejects.toBeInstanceOf(NotFoundError)
  })

  it("excludes itself from the weight check", async () => {
    const { service, repo } = setup()
    await service.update("a1", "k1", { weight: 60 } as never)
    expect(repo.otherWeights).toHaveBeenCalledWith("k1", "a1")
    await expect(service.update("a1", "k1", { weight: 61 } as never)).rejects.toThrow("ไม่เกิน 60%")
  })

  it("a type change takes the new type's default method; no type change keeps the old", async () => {
    const changed = setup()
    await changed.service.update("a1", "k1", { type: "PROJECT" } as never)
    expect(changed.repo.update.mock.calls[0]![2]).toMatchObject({
      type: "PROJECT",
      assessmentMethod: "WORK",
      typeLabel: "",
    })
    const kept = setup()
    await kept.service.update("a1", "k1", { name: "x" } as never)
    expect(kept.repo.update.mock.calls[0]![2]).toMatchObject({ assessmentMethod: "EXAM" })
  })

  it("custom type and custom method need a name", async () => {
    const { service } = setup()
    await expect(service.update("a1", "k1", { type: "CUSTOM" } as never)).rejects.toThrow(
      "ประเภทที่กำหนดเองต้องมีชื่อ",
    )
    await expect(
      service.update("a1", "k1", { assessmentMethod: "CUSTOM" } as never),
    ).rejects.toThrow("วิธีประเมินที่กำหนดเองต้องมีชื่อ")
  })

  it("lowering maxScore under existing scores is refused with the count and the highest", async () => {
    const { service, repo } = setup({ countScoresAbove: vi.fn(async () => 3) })
    const err = await service.update("a1", "k1", { maxScore: 10 } as never).catch((e: unknown) => e)
    expect(err).toBeInstanceOf(BusinessRuleError)
    expect((err as { errors: unknown }).errors).toEqual({
      conflictingScores: 3,
      maxExistingScore: 18,
    })
    expect(repo.update).not.toHaveBeenCalled()
  })

  it("passScore above maxScore is refused; otherwise passMark follows passScore/maxScore", async () => {
    const { service, repo } = setup()
    await expect(service.update("a1", "k1", { passScore: 25 } as never)).rejects.toThrow(
      "คะแนนผ่านต้องไม่เกินคะแนนเต็ม",
    )
    await service.update("a1", "k1", { passScore: 15 } as never)
    expect(repo.update.mock.calls[0]![2]).toMatchObject({ passMark: 75 })
  })

  it("GROUP mode refuses a typed weight", async () => {
    const { service } = setup({ weightMode: vi.fn(async () => "GROUP") })
    await expect(service.update("a1", "k1", { weight: 5 } as never)).rejects.toThrow("รายกลุ่ม")
  })
})

describe("remove / reorder / duplicate", () => {
  it("remove: scores must be acknowledged", async () => {
    const { service, repo } = setup({ countScores: vi.fn(async () => 7) })
    expect(await service.remove("a1", "k1", false)).toEqual({
      deleted: false,
      impact: { scores: 7 },
    })
    expect(repo.delete).not.toHaveBeenCalled()
    expect(await service.remove("a1", "k1", true)).toEqual({ deleted: true })
    expect(await setup().service.remove("a1", "k1", false)).toEqual({ deleted: true })
  })

  it("reorder needs exactly this course's activities, each once", async () => {
    const { service, repo } = setup()
    for (const bad of [["a1"], ["a1", "zz"], ["a1", "a2", "a3"]]) {
      await expect(service.reorder("k1", bad)).rejects.toBeInstanceOf(BusinessRuleError)
    }
    expect(repo.reorder).not.toHaveBeenCalled()
    await service.reorder("k1", ["a2", "a1"])
    expect(repo.reorder).toHaveBeenCalledWith(["a2", "a1"])
  })

  it("duplicate goes at the end", async () => {
    const { service, repo } = setup()
    await service.duplicate("a1", "k1")
    expect(repo.duplicate.mock.calls[0]![1]).toBe(5)
  })
})

describe("criteria", () => {
  it("computes CLO shares, sums and what is unlinked or unmeasured", async () => {
    const { service } = setup()
    const r = await service.criteria("k1")
    expect(r.data.objectives.map((o) => o.label)).toEqual(["1.1", "2.1", "2.2"])
    expect(r.meta).toMatchObject({
      activityWeightSums: { a1: 100, a2: 100 },
      cloShares: { c1: 50, c2: 50 },
      cloWeights: { c1: { computed: 50, planned: 50 }, c2: { computed: 50, planned: 40 } },
      unlinkedActivityIds: [],
      unmeasuredObjectiveIds: ["o3"],
      objectiveWeightSums: { c1: 100, c2: 100 },
      totalWeight: 100,
      isReadyForDashboard: true,
    })
  })

  it("is not ready when an activity is unlinked", async () => {
    const base = await setup().repo.matrix()
    const { service } = setup({
      matrix: vi.fn(async () => [base[0], base[1], [base[2]![0]], base[3]]),
    })
    const r = await service.criteria("k1")
    expect(r.meta.unlinkedActivityIds).toEqual(["a2"])
    expect(r.meta.isReadyForDashboard).toBe(false)
  })
})

describe("replaceCriteria", () => {
  it("refuses a cell outside the course before writing", async () => {
    const { service, repo } = setup()
    await expect(
      service.replaceCriteria("k1", {
        cells: [{ activityId: "a1", objectiveId: "zz", weight: 100 }],
      } as never),
    ).rejects.toThrow("ไม่ใช่ของรายวิชานี้")
    expect(repo.replaceMatrix).not.toHaveBeenCalled()
  })

  it("saves, then warns about every activity that is off 100 (FR-45)", async () => {
    const { service, repo } = setup()
    const r = await service.replaceCriteria("k1", {
      cells: [{ activityId: "a1", objectiveId: "o1", weight: 100 }],
    } as never)
    expect(repo.replaceMatrix).toHaveBeenCalled()
    expect(r.meta.warnings).toEqual([])
  })
})

describe("setGroupWeights", () => {
  it("GROUP: every key must be a group in use, and the sum may not pass 100", async () => {
    const { service, repo } = setup()
    await expect(
      service.setGroupWeights("k1", { mode: "GROUP", weights: { LAB: 10 } } as never),
    ).rejects.toThrow("ไม่มีกิจกรรมในกลุ่ม: LAB")
    await expect(
      service.setGroupWeights("k1", {
        mode: "GROUP",
        weights: { TEST: 60, "CUSTOM:สอบปากเปล่า": 41 },
      } as never),
    ).rejects.toThrow("เกิน 100%")
    expect(repo.setWeightMode).not.toHaveBeenCalled()
    const ok = await service.setGroupWeights("k1", {
      mode: "GROUP",
      weights: { TEST: 60, "CUSTOM:สอบปากเปล่า": 40 },
    } as never)
    expect(ok.mode).toBe("GROUP")
  })

  it("ACTIVITY mode skips the group checks and sends no weights", async () => {
    const { service, repo } = setup()
    await service.setGroupWeights("k1", { mode: "ACTIVITY" } as never)
    expect(repo.groupInputs).not.toHaveBeenCalled()
    expect(repo.setWeightMode).toHaveBeenCalledWith("k1", "ACTIVITY", {})
  })
})

describe("close / reopen", () => {
  it("close: once only, reason optional", async () => {
    const { service, repo } = setup()
    await service.close("a1", "k1", "ZERO", undefined, "u1")
    expect(repo.close).toHaveBeenCalledWith("a1", "k1", "ZERO", null, "u1")
    const closed = setup({ findById: vi.fn(async () => activity({ closedAt: new Date(0) })) })
    await expect(closed.service.close("a1", "k1", "LATER", "x", "u1")).rejects.toThrow(
      "ปิดรับคะแนนแล้ว",
    )
  })

  it("reopen: only a closed one", async () => {
    await expect(setup().service.reopen("a1")).rejects.toThrow("ยังไม่ได้ปิดรับคะแนน")
    const closed = setup({ findById: vi.fn(async () => activity({ closedAt: new Date(0) })) })
    expect(await closed.service.reopen("a1")).toEqual({ closedAt: null })
  })
})

describe("reorder: known gap", () => {
  // Same gap as CloService.reorder: length and membership are checked, uniqueness is not.
  // Expected to fail today (it.fails); remove `.fails` when the check is fixed.
  it.fails("refuses a list that repeats one activity and leaves another out", async () => {
    const { service, repo } = setup()
    await expect(service.reorder("k1", ["a1", "a1"])).rejects.toBeInstanceOf(BusinessRuleError)
    expect(repo.reorder).not.toHaveBeenCalled()
  })
})
