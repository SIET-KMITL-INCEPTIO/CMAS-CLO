import { act, cleanup, renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query"
import type { ReactNode } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { courseKeys } from "../courses/useCourses.ts"
import type { CellWrite } from "./score.types.ts"
import { usePutScores } from "./useScores.ts"

/**
 * NFR-01: typing scores must stay smooth. One cell reloads only what a score
 * can change, once the last pending write has answered — not every query of
 * every course, once per cell.
 */
const api = vi.hoisted(() => ({ put: vi.fn() }))
vi.mock("./scores.api.ts", () => ({ scoresApi: { put: api.put } }))

/** The queries on screen on the roster page, with another course's kept in the cache. */
const KEYS = {
  list: courseKeys.list(),
  course: courseKeys.one("k1"),
  clos: [...courseKeys.one("k1"), "clos"],
  objectives: [...courseKeys.one("k1"), "objectives", "c1"],
  criteria: [...courseKeys.one("k1"), "criteria"],
  grid: [...courseKeys.one("k1"), "scores", 1],
  results: [...courseKeys.one("k1"), "class-results"],
  activities: [...courseKeys.one("k1"), "activities"],
  grading: [...courseKeys.one("k1"), "grading"],
  other: [...courseKeys.one("k2"), "class-results"],
} as const
type Name = keyof typeof KEYS

let loads: Record<string, number>
const reloaded = () =>
  Object.keys(loads)
    .filter((k) => loads[k]! > 1)
    .sort()

function setup() {
  loads = {}
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
  const hook = renderHook(
    () => {
      for (const name of Object.keys(KEYS) as Name[]) {
        // eslint-disable-next-line react-hooks/rules-of-hooks -- a fixed list, same order every render
        useQuery({
          queryKey: KEYS[name],
          queryFn: () => {
            loads[name] = (loads[name] ?? 0) + 1
            // The grid is edited in place by the optimistic update, so it needs a grid's shape.
            return name === "grid" ? { activities: [], students: [], meta: {} } : name
          },
        })
      }
      return usePutScores("k1")
    },
    { wrapper },
  )
  return { client, hook }
}
const cell = (score: number): CellWrite[] => [
  { studentId: "s1", activityId: "a1", score, from: null },
]
const settle = () => act(() => new Promise((r) => setTimeout(r, 20)))

beforeEach(() => {
  api.put.mockReset() // braces: a returned function would run as teardown
})
afterEach(cleanup)

describe("usePutScores", () => {
  it("reloads what a score changes, and not the course's structure or other courses", async () => {
    api.put.mockResolvedValue({ written: 1, unchanged: 0 })
    const { hook } = setup()
    await waitFor(() => expect(Object.keys(loads)).toHaveLength(10))
    act(() => hook.result.current.mutate({ scores: cell(5), source: "MANUAL" }))
    await waitFor(() => expect(loads.grid).toBe(2))
    await settle()
    expect(reloaded()).toEqual(["activities", "grading", "grid", "results"])
  })

  it("waits for the last of several writes before reloading, once", async () => {
    const answers: (() => void)[] = []
    api.put.mockImplementation(
      () => new Promise((done) => answers.push(() => done({ written: 1, unchanged: 0 }))),
    )
    const { hook } = setup()
    await waitFor(() => expect(Object.keys(loads)).toHaveLength(10))
    act(() => hook.result.current.mutate({ scores: cell(5), source: "MANUAL" }))
    act(() => hook.result.current.mutate({ scores: cell(6), source: "MANUAL" }))
    await waitFor(() => expect(answers).toHaveLength(2))
    act(() => answers[0]!())
    await settle()
    // A reload now would overwrite the second cell with the old value on screen.
    expect(reloaded()).toEqual([])
    act(() => answers[1]!())
    await waitFor(() => expect(loads.grid).toBe(2))
    await settle()
    expect(loads.grid).toBe(2)
    expect(loads.results).toBe(2)
  })

  it("still reloads after a refused write, so the cell goes back to the saved value", async () => {
    api.put.mockRejectedValue(new Error("409"))
    const { hook } = setup()
    await waitFor(() => expect(Object.keys(loads)).toHaveLength(10))
    act(() => hook.result.current.mutate({ scores: cell(5), source: "MANUAL" }))
    await waitFor(() => expect(loads.grid).toBe(2))
  })
})
