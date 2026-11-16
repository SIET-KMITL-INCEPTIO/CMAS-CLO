import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { courseKeys } from "../courses/useCourses.ts"
import { gradingApi } from "./grading.api.ts"
import type { BandsBody } from "./grading.types.ts"

export const gradingKey = (courseId: string) => [...courseKeys.one(courseId), "grading"] as const

export const useGrading = (courseId: string) =>
  useQuery({ queryKey: gradingKey(courseId), queryFn: () => gradingApi.get(courseId) })

/**
 * Settings, ladder, freeze and overrides all change what the grading page and
 * the course's own settings (scale, method, pass mark) say, so one
 * invalidation of the course's key reaches both.
 */
function useGradingWrite<A, R>(fn: (args: A) => Promise<R>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fn,
    meta: { silent: true },
    onSettled: () => void queryClient.invalidateQueries({ queryKey: courseKeys.all }),
  })
}

export const useSaveBands = (courseId: string) =>
  useGradingWrite((body: BandsBody) => gradingApi.saveBands(courseId, body))
export const useRunGrading = (courseId: string) => useGradingWrite(() => gradingApi.run(courseId))
export const useUnfreeze = (courseId: string) =>
  useGradingWrite(() => gradingApi.unfreeze(courseId))
export const useOverride = () =>
  useGradingWrite((a: { studentId: string; grade: string; reason: string }) =>
    gradingApi.override(a.studentId, { grade: a.grade, reason: a.reason }),
  )
export const useClearOverride = () =>
  useGradingWrite((studentId: string) => gradingApi.clearOverride(studentId))
