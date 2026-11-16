import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const KEY = "cmas-display"

// display.ts reads localStorage once, when it is first imported.
async function fresh(saved?: unknown) {
  vi.resetModules()
  localStorage.clear()
  if (saved !== undefined)
    localStorage.setItem(KEY, typeof saved === "string" ? saved : JSON.stringify(saved))
  return (await import("./display.ts")).useDisplay
}

describe("display settings", () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => vi.restoreAllMocks())

  it("starts from the defaults and writes them to <html>", async () => {
    const d = (await fresh()).getState()
    expect(d).toMatchObject({ scale: "normal", density: "normal", theme: "light", listw: 296 })
    const html = document.documentElement
    expect(html.dataset.scale).toBe("normal")
    expect(html.dataset.theme).toBe("light")
    expect(html.style.getPropertyValue("--listw")).toBe("296px")
  })

  it("keeps valid saved values and drops unknown ones", async () => {
    const d = (
      await fresh({ scale: "large", density: "bogus", theme: "dark", listw: 1000 })
    ).getState()
    expect(d).toMatchObject({ scale: "large", density: "normal", theme: "dark", listw: 420 })
    expect(document.documentElement.dataset.theme).toBe("dark")
  })

  it("falls back to the defaults when storage holds garbage", async () => {
    const d = (await fresh("{not json")).getState()
    expect(d.scale).toBe("normal")
  })

  it("clamps the list width and saves every change", async () => {
    const store = await fresh()
    store.getState().set({ listw: 10, density: "compact" })
    expect(store.getState()).toMatchObject({ listw: 240, density: "compact" })
    expect(JSON.parse(localStorage.getItem(KEY)!)).toMatchObject({ listw: 240, density: "compact" })
    store.getState().set({ listw: 300.6 })
    expect(store.getState().listw).toBe(301)
  })

  it("'system' follows the device's colour scheme", async () => {
    vi.spyOn(window, "matchMedia").mockImplementation(
      (q: string) =>
        ({ matches: q.includes("dark"), addEventListener: () => {} }) as unknown as MediaQueryList,
    )
    const store = await fresh({ theme: "system" })
    expect(document.documentElement.dataset.theme).toBe("dark")
    expect(store.getState().theme).toBe("system")
  })

  it("still works when storage is blocked", async () => {
    const store = await fresh()
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked")
    })
    expect(() => store.getState().set({ scale: "xlarge" })).not.toThrow()
    expect(store.getState().scale).toBe("xlarge")
  })
})
