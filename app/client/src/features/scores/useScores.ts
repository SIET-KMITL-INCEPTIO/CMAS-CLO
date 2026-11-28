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

/** A course's structure: a score never changes it, so a cell does not reload it. */
const SCORES_LEAVE_ALONE = new Set<unknown>(["clos", "objectives", "criteria"])

/**
 * Writing cells: the grid shows the new values at once (every cached page),
 * and is reloaded when the server has answered — whatever it answered. A
 * refused or conflicting write therefore snaps back to what the database has.
 *
 * NFR-01, typing down a column: only what a score can change is reloaded (this
 * course, minus its settings and structure), and only after the last pending
 * write — an earlier reload would put the old value back under the next cell.
 */
export function usePutScores(courseId: string) {
  const queryClient = useQueryClient()
  const course = courseKeys.one(courseId)
  const prefix = [...course, "scores"]
  const mutationKey = ["put-scores", courseId]
  return useMutation({
    mutationKey,
    mutationFn: (a: { scores: CellWrite[]; source: WriteSource }) =>
      scoresApi.put(courseId, a.scores, a.source),
    meta: { silent: true },
    onMutate: (a) => {
      // A reload still on its way would answer with the values from before this write.
      void queryClient.cancelQueries({ queryKey: prefix })
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
    onSettled: () => {
      // This write still counts as pending here: more than one means another follows.
      if (queryClient.isMutating({ mutationKey }) > 1) return
      void queryClient.invalidateQueries({
        queryKey: course,
        // key[2] is the kind of query; the course itself (settings and counts) has none.
        predicate: (q) => q.queryKey.length > 2 && !SCORES_LEAVE_ALONE.has(q.queryKey[2]),
      })
    },
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

/** One page of the score change log (A-12): newest first, read-only. */
export const useScoreChanges = (courseId: string, page: number) =>
  useQuery({
    queryKey: [...courseKeys.one(courseId), "score-changes", page],
    queryFn: () => scoresApi.changes(courseId, page),
  })
