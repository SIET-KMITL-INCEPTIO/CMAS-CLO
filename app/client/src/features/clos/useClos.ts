import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "../../lib/apiClient.ts"
import { courseKeys } from "../courses/useCourses.ts"
import { closApi } from "./clos.api.ts"
import type { Bloom, CloInput, Objective, ObjectiveInput, Solo } from "./clo.types.ts"

export const cloKeys = {
  list: (courseId: string) => [...courseKeys.one(courseId), "clos"] as const,
  objectives: (courseId: string, cloId: string) =>
    [...courseKeys.one(courseId), "objectives", cloId] as const,
}

export const useCloList = (courseId: string) =>
  useQuery({ queryKey: cloKeys.list(courseId), queryFn: () => closApi.list(courseId) })

/** Every CLO's objectives, one request per CLO, in CLO order. */
export function useObjectivesOf(courseId: string, cloIds: string[]) {
  return useQueries({
    queries: cloIds.map((cloId) => ({
      queryKey: cloKeys.objectives(courseId, cloId),
      queryFn: () => closApi.objectives(cloId),
    })),
  })
}

/**
 * A CLO or objective write changes the CLO page, the objectives page, the
 * matrix, the step bar and the course's counts in the list pane — all of them
 * live under the course's key, so one invalidation reaches every one.
 */
function useCourseWrite<A, R>(fn: (args: A) => Promise<R>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fn,
    meta: { silent: true }, // forms show their own errors; pages toast where it fits
    onSettled: () => void queryClient.invalidateQueries({ queryKey: courseKeys.all }),
  })
}

type CloList = Awaited<ReturnType<typeof closApi.list>>

/**
 * The saved CLO goes into the list from the server's own answer (the same row
 * the list returns), so it shows the moment the write returns instead of
 * after the refetch below — a round trip to Supabase is seconds, not ms.
 */
export function useSaveClo(courseId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (a: { cloId: string | null; body: CloInput }) =>
      a.cloId ? closApi.update(a.cloId, a.body) : closApi.create(courseId, a.body),
    meta: { silent: true },
    onSuccess: (saved) =>
      queryClient.setQueryData<CloList>(
        cloKeys.list(courseId),
        (old) =>
          old && {
            ...old,
            clos: [...old.clos.filter((c) => c.id !== saved.id), saved].sort(
              (a, b) => a.number - b.number,
            ),
          },
      ),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: courseKeys.all }),
  })
}

/** One field at a time, from the inline boxes on the page. */
export const usePatchClo = () =>
  useCourseWrite((a: { cloId: string; body: Partial<CloInput> }) => closApi.update(a.cloId, a.body))

/** E2: several CLOs at once — "ใช้ค่าที่คำนวณได้ทุกข้อ". */
export const useSetCloWeights = () =>
  useCourseWrite(async (rows: { cloId: string; weight: number }[]) => {
    for (const r of rows) await closApi.update(r.cloId, { weight: r.weight })
  })

/** Moves the cards at once (renumbered as the server will), then reloads the truth. */
export function useReorderClos(courseId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (order: string[]) => closApi.reorder(courseId, order),
    meta: { silent: true },
    onMutate: (order) =>
      queryClient.setQueryData<Awaited<ReturnType<typeof closApi.list>>>(
        cloKeys.list(courseId),
        (old) =>
          old && {
            ...old,
            clos: order.flatMap((id, i) => {
              const c = old.clos.find((x) => x.id === id)
              return c ? [{ ...c, number: i + 1 }] : []
            }),
          },
      ),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: courseKeys.all }),
  })
}

/**
 * Deletes leave the list at once; the confirm dialog has already been
 * answered. A refused delete comes back with the refetch in onSettled.
 */
export function useDeleteClo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (cloId: string) => closApi.remove(cloId),
    meta: { silent: true },
    onMutate: (cloId) =>
      queryClient.setQueriesData<CloList>(
        { predicate: (q) => q.queryKey[0] === courseKeys.all[0] && q.queryKey[2] === "clos" },
        (old) => old && { ...old, clos: old.clos.filter((c) => c.id !== cloId) },
      ),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: courseKeys.all }),
  })
}

export const useSaveObjective = () =>
  useCourseWrite((a: { objectiveId: string | null; cloId: string; body: ObjectiveInput }) =>
    a.objectiveId
      ? closApi.updateObjective(a.objectiveId, a.body)
      : closApi.createObjective(a.cloId, a.body),
  )

export const useSetObjectiveWeights = () =>
  useCourseWrite(async (rows: { objectiveId: string; weight: number }[]) => {
    for (const r of rows) await closApi.updateObjective(r.objectiveId, { weight: r.weight })
  })

/** Same as useDeleteClo: gone from every cached objectives list at once. */
export function useDeleteObjective() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (objectiveId: string) => closApi.removeObjective(objectiveId),
    meta: { silent: true },
    onMutate: (objectiveId) =>
      queryClient.setQueriesData<Objective[]>(
        { predicate: (q) => q.queryKey[0] === courseKeys.all[0] && q.queryKey[2] === "objectives" },
        (old) => old?.filter((o) => o.id !== objectiveId),
      ),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: courseKeys.all }),
  })
}

/** The course's one CLO pass mark (E1) — a course setting, so course.settings decides. */
export const useSetCloPassMark = (courseId: string) =>
  useCourseWrite((cloPassMark: number) => apiClient.patch(`/courses/${courseId}`, { cloPassMark }))

// ── labels ─────────────────────────────────────────────────────────────

export const BLOOM_TH: Record<Bloom, string> = {
  REMEMBER: "จำ",
  UNDERSTAND: "เข้าใจ",
  APPLY: "ประยุกต์ใช้",
  ANALYZE: "วิเคราะห์",
  EVALUATE: "ประเมินค่า",
  CREATE: "สร้างสรรค์",
}
/** ⚠ Provisional names, as in index-q.html — not yet checked against the source document. */
export const SOLO_TH: Record<Solo, string> = {
  SURFACE: "พื้นผิว (Surface)",
  DEEP: "เชิงลึก (Deep)",
  TRANSFER: "ต่อยอด (Transfer)",
}
export const SOLO_HINT: Record<Solo, string> = {
  SURFACE: "บอกหรือทำได้ทีละองค์ประกอบ ยังไม่เชื่อมโยงกัน",
  DEEP: "เชื่อมโยงองค์ประกอบเป็นภาพรวม อธิบายความสัมพันธ์ได้",
  TRANSFER: "สรุปเป็นหลักการและนำไปใช้ในบริบทใหม่ได้",
}
/** O3 — the same fixed table as the server's BLOOM_TO_SOLO. */
export const BLOOM_TO_SOLO: Record<Bloom, Solo> = {
  REMEMBER: "SURFACE",
  UNDERSTAND: "SURFACE",
  APPLY: "DEEP",
  ANALYZE: "DEEP",
  EVALUATE: "TRANSFER",
  CREATE: "TRANSFER",
}

/** Two decimals at most, no trailing zeros: 33.333 → "33.33", 25 → "25". */
export const n2 = (v: number) => String(Math.round(v * 100) / 100)
export const near100 = (v: number) => Math.abs(v - 100) < 0.01

/**
 * "แบ่งเท่ากัน": n shares of 100 to two decimals, the last one taking the
 * rounding remainder so the sum is exactly 100.
 */
export function evenShares(n: number): number[] {
  if (n <= 0) return []
  const each = Math.floor((100 / n) * 100) / 100
  const out = Array.from({ length: n }, () => each)
  out[n - 1] = Math.round((100 - each * (n - 1)) * 100) / 100
  return out
}
