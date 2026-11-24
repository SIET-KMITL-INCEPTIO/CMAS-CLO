/**
 * Which term the list pane and Ctrl K show. Per browser, in localStorage, so a
 * reload keeps it — a convenience: blocked or empty storage means "every term".
 *
 * A saved term the caller no longer has (course deleted, another account on
 * this browser) shows every term rather than an empty list, and stays saved.
 */
import { create } from "zustand"

export const ALL = "all"
const KEY = "cmas-term"

type Termed = { semester: number; year: number }

/** "2570-1": sorts and compares as a string, survives JSON. */
export const termKey = (c: Termed) => `${c.year}-${c.semester}`
export const termLabel = (key: string) => {
  const [year, semester] = key.split("-")
  return `ภาค ${semester}/${year}`
}

/** The caller's terms, newest first. */
export function termsOf(courses: Termed[]): string[] {
  return [...new Set(courses.map(termKey))].sort((a, b) => {
    const [ay, as] = a.split("-").map(Number)
    const [by, bs] = b.split("-").map(Number)
    return by! - ay! || bs! - as!
  })
}

/** The term actually applied: the saved one, or every term when it is not in the list. */
export const effectiveTerm = (saved: string, terms: string[]) =>
  terms.includes(saved) ? saved : ALL

export const inTerm = (term: string) => (c: Termed) => term === ALL || termKey(c) === term

function load(): string {
  try {
    return localStorage.getItem(KEY) ?? ALL
  } catch {
    return ALL
  }
}

export const useTermFilter = create<{ term: string; setTerm: (term: string) => void }>()((set) => ({
  term: load(),
  setTerm: (term) => {
    try {
      localStorage.setItem(KEY, term)
    } catch {
      /* storage blocked: the choice lasts until reload */
    }
    set({ term })
  },
}))
