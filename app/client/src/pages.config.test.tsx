import { act, cleanup, render, screen } from "@testing-library/react"
import { Component, Suspense, type ReactNode } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { appRoutes, courseRoutes, page, preloadPage, publicRoutes } from "./pages.config.ts"

/** NFR-01: a reload starts fetching its own page's file at once, and only that one. */
afterEach(cleanup)

const spyAll = () =>
  [...publicRoutes, ...appRoutes, ...courseRoutes].map((r) => ({
    path: r.path,
    spy: vi.spyOn(r.element, "load").mockResolvedValue({ default: () => null }),
  }))
const loaded = (spies: ReturnType<typeof spyAll>) =>
  spies.filter((s) => s.spy.mock.calls.length).map((s) => s.path)

describe("preloadPage", () => {
  it.each([
    ["/courses/c1/roster", "roster"],
    ["/courses/c1/results", "results"],
    ["/courses/c1", ""],
    ["/courses", "/courses"],
    ["/", "/"],
    ["/auth/login", "/auth/login"],
  ])("%s fetches the file of that page only", (pathname, path) => {
    const spies = spyAll()
    preloadPage(pathname)
    expect(loaded(spies)).toEqual([path])
    vi.restoreAllMocks()
  })

  it("fetches nothing for a path no page has", () => {
    const spies = spyAll()
    preloadPage("/nowhere/at/all")
    expect(loaded(spies)).toEqual([])
    vi.restoreAllMocks()
  })
})

class Boundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError = () => ({ failed: true })
  render = () => (this.state.failed ? "ล้มเหลว" : this.props.children)
}
const show = (P: ReturnType<typeof page>) =>
  render(
    <Boundary>
      <Suspense fallback="กำลังโหลด">
        <P />
      </Suspense>
    </Boundary>,
  )

describe("page", () => {
  it("renders at once, without a loading state, when its file is already in", async () => {
    const P = page(() => Promise.resolve({ default: () => "หน้า" }))
    await P.load()
    show(P)
    expect(screen.queryByText("กำลังโหลด")).toBeNull()
    expect(screen.getByText("หน้า")).toBeTruthy()
  })

  it("shows the loading state until its file arrives, and downloads it once", async () => {
    let arrive!: (m: { default: () => string }) => void
    const loader = vi.fn(() => new Promise<{ default: () => string }>((r) => (arrive = r)))
    const P = page(loader)
    // React 19: a render that suspends must be awaited inside act.
    await act(async () => {
      show(P)
    })
    expect(screen.getByText("กำลังโหลด")).toBeTruthy()
    await act(async () => {
      arrive({ default: () => "หน้า" })
      await P.load()
    })
    expect(screen.getByText("หน้า")).toBeTruthy()
    expect(loader).toHaveBeenCalledTimes(1)
  })

  it("tries the download again after a failure", async () => {
    const loader = vi
      .fn<() => Promise<{ default: () => string }>>()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValue({ default: () => "หน้า" })
    const P = page(loader)
    await expect(P.load()).rejects.toThrow("offline")
    await act(() => P.load())
    show(P)
    expect(screen.getByText("หน้า")).toBeTruthy()
    expect(loader).toHaveBeenCalledTimes(2)
  })
})
