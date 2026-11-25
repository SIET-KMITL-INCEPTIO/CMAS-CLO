import { describe, expect, it } from "vitest"
import { groupByCourse, type ManyCourseRows } from "./course-data-group.js"

/** G4: rows read for many courses split back into one CourseData each, as load() would give. */
const course = (id: string) =>
  ({
    id,
    code: id,
    name: id,
    section: "1",
    semester: 1,
    year: 2569,
    cloPassMark: 50,
    classTarget: 70,
    passCriteria: null,
    gradeScale: null,
    gradeMethod: null,
  }) as unknown as ManyCourseRows["courses"][number]

const rows = (): ManyCourseRows => ({
  courses: [course("k2"), course("k1")],
  clos: [
    { id: "c1", courseId: "k1", number: 1, description: "", classTarget: null },
    { id: "c9", courseId: "k2", number: 1, description: "", classTarget: null },
    { id: "c2", courseId: "k1", number: 2, description: "", classTarget: null },
  ],
  objectives: [
    { id: "o1", cloId: "c1", number: 1, weight: 100 },
    { id: "o9", cloId: "c9", number: 1, weight: 100 },
    { id: "o2", cloId: "c2", number: 1, weight: 100 },
  ],
  activities: [
    { id: "a1", courseId: "k1", name: "A1", weight: 60, maxScore: 10, closedAt: null },
    { id: "a9", courseId: "k2", name: "A9", weight: 100, maxScore: 10, closedAt: null },
    { id: "a2", courseId: "k1", name: "A2", weight: 40, maxScore: 10, closedAt: null },
  ] as ManyCourseRows["activities"],
  cells: [
    { activityId: "a1", objectiveId: "o1", weight: 100 },
    { activityId: "a9", objectiveId: "o9", weight: 100 },
    { activityId: "a2", objectiveId: "o2", weight: 100 },
  ],
  students: [
    { id: "s1", courseId: "k1", studentCode: "001", name: "หนึ่ง", status: "ENROLLED" },
    { id: "s9", courseId: "k2", studentCode: "009", name: "เก้า", status: "ENROLLED" },
  ] as ManyCourseRows["students"],
  scores: [
    { studentId: "s1", activityId: "a1", score: 8, status: "SCORED" },
    { studentId: "s9", activityId: "a9", score: 5, status: "SCORED" },
    { studentId: "s1", activityId: "a2", score: 7, status: "SCORED" },
  ] as ManyCourseRows["scores"],
})

describe("groupByCourse", () => {
  it("gives each course only its own rows, in the order they came", () => {
    const k1 = groupByCourse(["k1", "k2"], rows()).get("k1")!
    expect(k1.course).toMatchObject({ code: "k1" })
    expect(k1.clos.map((c) => c.id)).toEqual(["c1", "c2"])
    expect(k1.objectives.map((o) => o.id)).toEqual(["o1", "o2"])
    expect(k1.activities.map((a) => a.id)).toEqual(["a1", "a2"])
    expect(k1.cells.map((c) => c.activityId)).toEqual(["a1", "a2"])
    expect(k1.students.map((s) => s.id)).toEqual(["s1"])
    expect(k1.scores.map((s) => s.activityId)).toEqual(["a1", "a2"])
  })

  it("drops the courseId it grouped by, so the shape is load()'s exactly", () => {
    const k2 = groupByCourse(["k1", "k2"], rows()).get("k2")!
    expect(k2.clos[0]).toEqual({ id: "c9", number: 1, description: "", classTarget: null })
    expect(k2.activities[0]).not.toHaveProperty("courseId")
    expect(k2.students[0]).not.toHaveProperty("courseId")
  })

  it("follows the asked order, skips a course that is gone, and keeps an empty course", () => {
    const r = rows()
    r.courses.push(course("k3"))
    const out = groupByCourse(["k3", "gone", "k2", "k1"], r)
    expect([...out.keys()]).toEqual(["k3", "k2", "k1"])
    expect(out.get("k3")).toMatchObject({ clos: [], activities: [], students: [], scores: [] })
  })

  it("leaves out rows of a course nobody asked for", () => {
    const out = groupByCourse(["k1"], rows())
    expect([...out.keys()]).toEqual(["k1"])
    expect(out.get("k1")!.scores).toHaveLength(2)
  })
})
