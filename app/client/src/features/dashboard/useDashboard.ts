import { useQuery } from "@tanstack/react-query"
import { courseKeys } from "../courses/useCourses.ts"
import { dashboardApi } from "./dashboard.api.ts"

// Under the course's key, so every write that invalidates the course refreshes these too.
export const dashboardKeys = {
  attainment: (courseId: string) => [...courseKeys.one(courseId), "attainment"] as const,
  atRisk: (courseId: string) => [...courseKeys.one(courseId), "at-risk"] as const,
  summary: (courseId: string) => [...courseKeys.one(courseId), "summary"] as const,
  classResults: (courseId: string) => [...courseKeys.one(courseId), "class-results"] as const,
  student: (courseId: string, studentId: string) =>
    [...courseKeys.one(courseId), "result", studentId] as const,
}

export const useAttainment = (courseId: string) =>
  useQuery({
    queryKey: dashboardKeys.attainment(courseId),
    queryFn: () => dashboardApi.attainment(courseId),
  })

export const useAtRisk = (courseId: string) =>
  useQuery({
    queryKey: dashboardKeys.atRisk(courseId),
    queryFn: () => dashboardApi.atRisk(courseId),
  })

export const useStudentResult = (courseId: string, studentId: string | null) =>
  useQuery({
    queryKey: dashboardKeys.student(courseId, studentId ?? ""),
    queryFn: () => dashboardApi.student(courseId, studentId!),
    enabled: studentId !== null,
  })

export const useCourseSummary = (courseId: string) =>
  useQuery({
    queryKey: dashboardKeys.summary(courseId),
    queryFn: () => dashboardApi.summary(courseId),
  })

/** The results table in one request (it used to be one per student). */
export const useClassResults = (courseId: string, enabled = true) =>
  useQuery({
    queryKey: dashboardKeys.classResults(courseId),
    queryFn: () => dashboardApi.classResults(courseId),
    enabled,
  })
