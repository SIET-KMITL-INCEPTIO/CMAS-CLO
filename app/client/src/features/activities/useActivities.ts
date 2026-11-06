import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { courseKeys } from "../courses/useCourses.ts"
import { activitiesApi } from "./activities.api.ts"
import type { Activity, ActivityInput, Cell } from "./activity.types.ts"

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

/**
 * Every activity write changes the list, the matrix, the step bar, the roster's
 * columns and the course's counts — all under the course's key.
 */
function useActivityWrite<A, R>(fn: (args: A) => Promise<R>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fn,
    meta: { silent: true },
    onSettled: () => void queryClient.invalidateQueries({ queryKey: courseKeys.all }),
  })
}

/**
 * The activity and the objectives it measures in one save: the activity first
 * (it needs its id), then the whole matrix with this activity's cells swapped
 * in — the API replaces the matrix as a whole (FR-44).
 */
export const useSaveActivity = (courseId: string) =>
  useActivityWrite(
    async (a: {
      activityId: string | null
      body: ActivityInput | Partial<ActivityInput>
      /** objectiveId → % of the activity; null leaves the links alone. */
      links: Record<string, number> | null
    }) => {
      const saved = a.activityId
        ? await activitiesApi.update(a.activityId, a.body)
        : await activitiesApi.create(courseId, a.body as ActivityInput)
      if (a.links) {
        // Read the matrix now, not from the page: another tab may have changed it.
        const fresh = await activitiesApi.criteria(courseId)
        const cells: Cell[] = [
          ...fresh.cells.filter((c) => c.activityId !== saved.id),
          ...Object.entries(a.links).map(([objectiveId, weight]) => ({
            activityId: saved.id,
            objectiveId,
            weight,
          })),
        ]
        await activitiesApi.replaceCriteria(courseId, cells)
      }
      return saved
    },
  )

export const useDeleteActivity = () =>
  useActivityWrite((activityId: string) => activitiesApi.remove(activityId))

export const useDuplicateActivity = () =>
  useActivityWrite((activityId: string) => activitiesApi.duplicate(activityId))

/** Moves the rows at once, then reloads the truth. */
export function useReorderActivities(courseId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (order: string[]) => activitiesApi.reorder(courseId, order),
    meta: { silent: true },
    onMutate: (order) =>
      queryClient.setQueryData<Awaited<ReturnType<typeof activitiesApi.list>>>(
        activityKeys.list(courseId),
        (old) =>
          old && {
            ...old,
            activities: order.flatMap((id, i) => {
              const a = old.activities.find((x) => x.id === id)
              return a ? [{ ...a, order: i } as Activity] : []
            }),
          },
      ),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: courseKeys.all }),
  })
}

export const useSetWeightMode = (courseId: string) =>
  useActivityWrite((a: { mode: "MANUAL" | "GROUP"; weights?: Record<string, number> }) =>
    activitiesApi.setGroupWeights(courseId, a),
  )

/** The matrix edited in place: always the whole matrix (FR-44). */
export const useReplaceCriteria = (courseId: string) =>
  useActivityWrite((cells: Cell[]) => activitiesApi.replaceCriteria(courseId, cells))
