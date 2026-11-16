import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { coursesApi } from "./courses.api.ts"
import type { CourseInput } from "./course.types.ts"

export const courseKeys = {
  all: ["courses"] as const,
  list: () => [...courseKeys.all, "list"] as const,
  one: (courseId: string) => [...courseKeys.all, courseId] as const,
  impact: (courseId: string) => [...courseKeys.all, courseId, "impact"] as const,
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

export function useCourseImpact(courseId: string | null) {
  return useQuery({
    queryKey: courseKeys.impact(courseId ?? ""),
    queryFn: () => coursesApi.impact(courseId!),
    enabled: Boolean(courseId),
    staleTime: 0,
  })
}

/** Waits until typing pauses, so "สมชาย" is one request, not five. */
export function useInstructorSearch(q: string) {
  const [term, setTerm] = useState(q.trim())
  useEffect(() => {
    const t = setTimeout(() => setTerm(q.trim()), 250)
    return () => clearTimeout(t)
  }, [q])
  return useQuery({
    queryKey: ["users", "instructors", term],
    queryFn: () => coursesApi.searchInstructors(term),
    enabled: term.length > 0,
    staleTime: 60_000,
  })
}

/**
 * Every write refreshes the list pane, the course page and the manager at once.
 * Not awaited: the sheet closes as soon as the server answers, and the lists
 * catch up behind it. Settled, not success: an edit that stops halfway (one
 * instructor refused) has still changed what came before it.
 */
function useCourseMutation<A, R>(fn: (args: A) => Promise<R>, forget?: (args: A) => string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fn,
    meta: { silent: true }, // the form shows the error where it belongs
    onSettled: (_data, error, args) => {
      // A deleted course: drop its own queries so nothing asks for it again (a 404).
      const gone = !error && forget ? forget(args) : null
      if (gone) {
        queryClient.removeQueries({ queryKey: courseKeys.one(gone) })
        queryClient.setQueryData<Awaited<ReturnType<typeof coursesApi.list>>>(
          courseKeys.list(),
          (old) => old && { ...old, courses: old.courses.filter((c) => c.id !== gone) },
        )
      }
      void queryClient.invalidateQueries({ queryKey: courseKeys.all })
    },
  })
}

export const useCreateCourse = () =>
  useCourseMutation((body: CourseInput & { instructors: { userId: string }[] }) =>
    coursesApi.create(body),
  )

/**
 * Edit = the settings PATCH plus each instructor added or removed. The
 * settings go first; an instructor that cannot be removed (the last one, or
 * yourself — S-9) stops the save with the server's message.
 */
export const useSaveCourse = () =>
  useCourseMutation(
    async (a: {
      courseId: string
      body: Partial<CourseInput> | null
      add: string[]
      remove: string[]
    }) => {
      if (a.body) await coursesApi.update(a.courseId, a.body)
      for (const userId of a.add) await coursesApi.addInstructor(a.courseId, userId)
      for (const userId of a.remove) await coursesApi.removeInstructor(a.courseId, userId)
    },
  )

export const useDuplicateCourse = () =>
  useCourseMutation((courseId: string) => coursesApi.duplicate(courseId))
export const useDeleteCourse = () =>
  useCourseMutation(
    (courseId: string) => coursesApi.remove(courseId),
    (courseId) => courseId,
  )

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
