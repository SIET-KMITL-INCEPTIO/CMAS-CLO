/** The course list remembers how it was last grouped and shown, per browser. */
import { COURSE_GROUPBY, type GroupBy } from "./courseView.ts"

export type View = "card" | "table"
export const PREF = "cmas.courses"

export function readPref(): { group: GroupBy; view: View } {
  try {
    const p = JSON.parse(localStorage.getItem(PREF) ?? "{}") as { group?: GroupBy; view?: View }
    return {
      group: COURSE_GROUPBY.some((g) => g.id === p.group) ? p.group! : "term",
      view: p.view === "table" ? "table" : "card",
    }
  } catch {
    return { group: "term", view: "card" }
  }
}
export function writePref(p: { group: GroupBy; view: View }) {
  try {
    localStorage.setItem(PREF, JSON.stringify(p))
  } catch {
    /* private window — the choice lasts this visit only */
  }
}
