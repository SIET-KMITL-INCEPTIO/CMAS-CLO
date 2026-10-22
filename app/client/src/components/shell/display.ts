/**
 * Reader settings that survive a reload (index-q "Principle 2"): text size,
 * row density, and the list pane's width. Per browser, in localStorage — a
 * convenience, so a blocked or empty storage just means the defaults.
 */
import { create } from "zustand"

export type Scale = "normal" | "large" | "xlarge"
export type Density = "compact" | "normal" | "comfortable"

export const SCALES: { id: Scale; label: string }[] = [
  { id: "normal", label: "ปกติ" },
  { id: "large", label: "ใหญ่" },
  { id: "xlarge", label: "ใหญ่มาก" },
]
export const DENSITIES: { id: Density; label: string }[] = [
  { id: "compact", label: "กระชับ" },
  { id: "normal", label: "ปกติ" },
  { id: "comfortable", label: "โปร่ง" },
]

const KEY = "cmas-display"
const MIN_LIST = 240
const MAX_LIST = 420

type Display = { scale: Scale; density: Density; listw: number }

function load(): Display {
  const fallback: Display = { scale: "normal", density: "normal", listw: 296 }
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? "{}") as Partial<Display>
    return {
      scale: SCALES.some((s) => s.id === saved.scale) ? saved.scale! : fallback.scale,
      density: DENSITIES.some((d) => d.id === saved.density) ? saved.density! : fallback.density,
      listw: clampWidth(saved.listw ?? fallback.listw),
    }
  } catch {
    return fallback
  }
}

const clampWidth = (w: number) => Math.min(MAX_LIST, Math.max(MIN_LIST, Math.round(w)))

function apply(d: Display) {
  const html = document.documentElement
  html.dataset.scale = d.scale
  html.dataset.density = d.density
  html.style.setProperty("--listw", `${d.listw}px`)
  try {
    localStorage.setItem(KEY, JSON.stringify(d))
  } catch {
    /* storage blocked: the setting lasts until reload */
  }
}

type DisplayStore = Display & {
  set: (patch: Partial<Display>) => void
}

export const useDisplay = create<DisplayStore>()((set, get) => {
  const initial = load()
  apply(initial)
  return {
    ...initial,
    set: (patch) => {
      const next = { ...get(), ...patch }
      if (patch.listw !== undefined) next.listw = clampWidth(patch.listw)
      apply(next)
      set(next)
    },
  }
})
