import { useQuery } from "@tanstack/react-query"
import { coursesApi } from "./courses.api.ts"

export const courseKeys = {
  all: ["courses"] as const,
  list: () => [...courseKeys.all, "list"] as const,
  one: (courseId: string) => [...courseKeys.all, courseId] as const,
}

export function useCourseList() {
  return useQuery({ queryKey: courseKeys.list(), queryFn: () => coursesApi.list() })
}

export function useCourse(courseId: string | undefined) {
  return useQuery({
    queryKey: courseKeys.one(courseId ?? ""),
    queryFn: () => coursesApi.get(courseId!),
    enabled: Boolean(courseId),
  })
}

/** Newest term first, then code and section — the order of the list pane (index-q paintList). */
export function byTerm<T extends { year: number; semester: number; code: string; section: string }>(
  a: T,
  b: T,
) {
  return (
    b.year - a.year ||
    b.semester - a.semester ||
    (a.code + a.section).localeCompare(b.code + b.section)
  )
}
