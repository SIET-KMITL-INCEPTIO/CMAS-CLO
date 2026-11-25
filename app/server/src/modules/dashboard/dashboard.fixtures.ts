/** Shared by the dashboard read-model tests and the export tests. */
import { vi } from "vitest"
import type {
  CourseDataRepository,
  CourseSnapshot,
} from "../../repositories/course-data.repository.js"
import { DashboardExportService } from "./dashboard-export.service.js"
import { DashboardService } from "./dashboard.service.js"

/**
 * Two CLOs, each measured by one activity (weight 50, out of 10).
 *   s1  9 / 8  → 90 / 80, total 85: passes everything
 *   s2  9 / 3  → 90 / 30, total 60: course passes, CLO 2 below the 60 mark
 *   s3  —      → nothing scored: NOT_EVALUATED, never at risk
 *   s5  2 / 2  → 20 / 20, total 20: fails the course
 *   s6  withdrawn
 */
export function snapshot(over: Partial<CourseSnapshot["course"]> = {}): CourseSnapshot {
  const course = {
    id: "k1",
    code: "90641001",
    name: "วิชาทดสอบ",
    section: "01",
    semester: 1,
    year: 2569,
    cloPassMark: 60,
    classTarget: 60,
    passCriteria: 50,
    gradeScale: "LETTER" as const,
    gradeMethod: "CRITERION_REFERENCED" as const,
    ...over,
  }
  const activities = [
    { id: "a1", name: "Quiz 1", weight: 50, maxScore: 10, closedAt: null, passMark: null },
    { id: "a2", name: "Quiz 2", weight: 50, maxScore: 10, closedAt: null, passMark: null },
  ]
  const sc = (studentId: string, activityId: string, score: number) => ({
    studentId,
    activityId,
    score,
    status: "SCORED" as const,
  })
  const data = {
    course,
    clos: [
      { id: "c1", number: 1, description: "อธิบาย 1", classTarget: null },
      { id: "c2", number: 2, description: "อธิบาย 2", classTarget: null },
    ],
    objectives: [
      { id: "o1", cloId: "c1", number: 1, weight: 100 },
      { id: "o2", cloId: "c2", number: 1, weight: 100 },
    ],
    activities,
    cells: [
      { activityId: "a1", objectiveId: "o1", weight: 100 },
      { activityId: "a2", objectiveId: "o2", weight: 100 },
    ],
    students: [
      { id: "s1", studentCode: "001", name: "หนึ่ง", status: "ENROLLED" as const },
      { id: "s2", studentCode: "002", name: "สอง", status: "ENROLLED" as const },
      { id: "s3", studentCode: "003", name: "สาม", status: "ENROLLED" as const },
      { id: "s5", studentCode: "005", name: "ห้า", status: "ENROLLED" as const },
      { id: "s6", studentCode: "006", name: "หก", status: "WITHDRAWN" as const },
    ],
    scores: [
      sc("s1", "a1", 9),
      sc("s1", "a2", 8),
      sc("s2", "a1", 9),
      sc("s2", "a2", 3),
      sc("s5", "a1", 2),
      sc("s5", "a2", 2),
    ],
  }
  return {
    course,
    data,
    bands: [
      { grade: "A", minValue: 80 },
      { grade: "B", minValue: 70 },
      { grade: "C", minValue: 60 },
      { grade: "D", minValue: 50 },
      { grade: "F", minValue: 0 },
    ],
    grades: [],
    plans: [{ studentId: "s2", cloId: "c2", plan: "ทำแบบฝึกเพิ่ม", updatedAt: new Date(0) }],
    passMarks: new Map(activities.map((x) => [x.id, x.passMark])),
  } as unknown as CourseSnapshot
}

export function setup(snap: CourseSnapshot = snapshot(), ids = ["k1"]) {
  const data = {
    load: vi.fn(async () => snap),
    loadMany: vi.fn(async (ids: string[]) => new Map(ids.map((id) => [id, snap.data]))),
    visibleCourseIds: vi.fn(async () => ids),
  }
  const repo = data as unknown as CourseDataRepository
  const service = new DashboardService(repo)
  return { service, exports: new DashboardExportService(repo, service), data }
}
