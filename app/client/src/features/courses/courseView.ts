/**
 * Labels and grouping of the course manager (index-q.html viewCourses).
 * Kept apart from the page so the form and the delete modal read the same words.
 */
import type { Course } from "./course.types.ts"

export const SCALE_TH = { LETTER: "A–F", PASS_FAIL: "ผ่าน / ไม่ผ่าน" } as const
export const METHOD_TH = { CRITERION_REFERENCED: "อิงเกณฑ์", NORM_REFERENCED: "อิงกลุ่ม" } as const

/** "3 (2-2-5)" — the way a course's credits are printed in มคอ. */
export const creditLabel = (c: Course) =>
  `${Number(c.credits)} (${Number(c.lectureHours)}-${Number(c.practiceHours)}-${Number(c.selfStudyHours)})`

/** What the reader types before a course is deleted (J3). */
export const deletePhrase = (c: Pick<Course, "code" | "section" | "semester" | "year">) =>
  `${c.code}-sec${c.section}-${c.semester}-${c.year}-delete`

export type GroupBy = "year" | "term" | "section" | "code" | "none"

export const COURSE_GROUPBY: {
  id: GroupBy
  label: string
  of: (c: Course) => string
  head: (c: Course) => string
}[] = [
  { id: "year", label: "ปีการศึกษา", of: (c) => `y${c.year}`, head: (c) => `ปีการศึกษา ${c.year}` },
  {
    id: "term",
    label: "ภาคเรียน",
    of: (c) => `${c.year}/${c.semester}`,
    head: (c) => `ภาค ${c.semester}/${c.year}`,
  },
  {
    id: "section",
    label: "หมู่เรียน (Sec)",
    of: (c) => `sec${c.section}`,
    head: (c) => `หมู่เรียน ${c.section}`,
  },
  { id: "code", label: "รหัสวิชา", of: (c) => c.code, head: (c) => `${c.code} · ${c.name}` },
  { id: "none", label: "ไม่จัดกลุ่ม", of: () => "*", head: () => "" },
]

export type Bucket<T extends Course> = { key: string; head: string; sample: T; items: T[] }

/** Groups in the order chosen, newest term first — the current term is what people look for. */
export function bucketsOf<T extends Course>(list: T[], gb: GroupBy): Bucket<T>[] {
  const g = COURSE_GROUPBY.find((x) => x.id === gb) ?? COURSE_GROUPBY[1]!
  const seen = new Map<string, Bucket<T>>()
  for (const c of list) {
    const k = g.of(c)
    const b = seen.get(k) ?? { key: k, head: g.head(c), sample: c, items: [] }
    b.items.push(c)
    seen.set(k, b)
  }
  return [...seen.values()].sort(
    (a, b) =>
      b.sample.year - a.sample.year ||
      b.sample.semester - a.sample.semester ||
      a.head.localeCompare(b.head),
  )
}

/** The current Thai academic term: semester 1 runs from June, semester 2 from November. */
export function currentTerm(now = new Date()) {
  const m = now.getMonth() + 1
  const be = now.getFullYear() + 543
  if (m >= 6 && m <= 10) return { semester: 1, year: be }
  if (m >= 11) return { semester: 2, year: be }
  return { semester: 2, year: be - 1 }
}
