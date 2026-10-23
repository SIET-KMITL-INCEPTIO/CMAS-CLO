import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { courseKeys } from "../courses/useCourses.ts"
import type { CellWrite, CloseBlank, Grid, WriteSource } from "./score.types.ts"
import { scoresApi } from "./scores.api.ts"

export const scoreKeys = {
  grid: (courseId: string, page: number) => [...courseKeys.one(courseId), "scores", page] as const,
}

export const useScoreGrid = (courseId: string, page: number) =>
  useQuery({
    queryKey: scoreKeys.grid(courseId, page),
    queryFn: () => scoresApi.grid(courseId, page),
  })

/** A score write changes the grid, the activities' progress and the step bar's "x / y cells". */
function useScoreWrite<A, R>(fn: (args: A) => Promise<R>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fn,
    meta: { silent: true },
    onSettled: () => void queryClient.invalidateQueries({ queryKey: courseKeys.all }),
  })
}

/**
 * Writing cells: the grid shows the new values at once (every cached page),
 * and is reloaded when the server has answered — whatever it answered. A
 * refused or conflicting write therefore snaps back to what the database has.
 */
export function usePutScores(courseId: string) {
  const queryClient = useQueryClient()
  const prefix = [...courseKeys.one(courseId), "scores"]
  return useMutation({
    mutationFn: (a: { scores: CellWrite[]; source: WriteSource }) =>
      scoresApi.put(courseId, a.scores, a.source),
    meta: { silent: true },
    onMutate: (a) => {
      const by = new Map(a.scores.map((w) => [`${w.studentId}|${w.activityId}`, w.score]))
      queryClient.setQueriesData<Grid>(
        { queryKey: prefix },
        (old) =>
          old && {
            ...old,
            students: old.students.map((s) => {
              const touched = old.activities.filter((x) => by.has(`${s.id}|${x.id}`))
              return touched.length
                ? {
                    ...s,
                    scores: {
                      ...s.scores,
                      ...Object.fromEntries(touched.map((x) => [x.id, by.get(`${s.id}|${x.id}`)!])),
                    },
                  }
                : s
            }),
          },
      )
    },
    onSettled: () => void queryClient.invalidateQueries({ queryKey: courseKeys.all }),
  })
}

export const useCloseActivity = () =>
  useScoreWrite((a: { activityId: string; blank: CloseBlank; reason?: string }) =>
    scoresApi.close(a.activityId, { blank: a.blank, ...(a.reason ? { reason: a.reason } : {}) }),
  )

export const useReopenActivity = () =>
  useScoreWrite((activityId: string) => scoresApi.reopen(activityId))

export const useCommitScoreImport = (courseId: string) =>
  useScoreWrite((previewToken: string) => scoresApi.commitImport(courseId, previewToken))
