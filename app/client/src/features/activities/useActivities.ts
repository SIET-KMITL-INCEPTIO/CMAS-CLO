import { useQuery } from "@tanstack/react-query"
import { courseKeys } from "../courses/useCourses.ts"
import { activitiesApi } from "./activities.api.ts"

export const activityKeys = {
  list: (courseId: string) => [...courseKeys.one(courseId), "activities"] as const,
  criteria: (courseId: string) => [...courseKeys.one(courseId), "criteria"] as const,
}

export const useActivityList = (courseId: string) =>
  useQuery({
    queryKey: activityKeys.list(courseId),
    queryFn: () => activitiesApi.list(courseId),
  })

/** The matrix: which activity measures which objective, and the sums the setup steps check. */
export const useCriteria = (courseId: string) =>
  useQuery({
    queryKey: activityKeys.criteria(courseId),
    queryFn: () => activitiesApi.criteria(courseId),
  })
