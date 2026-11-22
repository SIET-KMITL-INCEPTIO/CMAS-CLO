import { Chip } from "../../components/ui/Badges.tsx"
import type { Course, CourseWithReadiness } from "./course.types.ts"
import type { Bucket } from "./courseView.ts"

export const courseHref = (c: Course) => `/courses/${c.id}`

export function staffLine(c: Course) {
  const [first, ...rest] = c.instructors
  if (!first) return <span className="text-bad">ยังไม่มีผู้สอน</span>
  return (
    <>
      {first.name}
      {rest.length > 0 && <span className="text-dim"> +{rest.length}</span>}
    </>
  )
}

export const readyChip = (c: CourseWithReadiness) =>
  c.readiness.blockers.length ? (
    <Chip tone="bad" title={c.readiness.blockers.join(" · ")}>
      {c.readiness.blockers.length} ข้อค้าง
    </Chip>
  ) : (
    <Chip tone="ok">พร้อม</Chip>
  )

export function bucketNote(b: Bucket<CourseWithReadiness>) {
  const students = b.items.reduce((t, c) => t + c.counts.students, 0)
  const ready = b.items.filter((c) => c.readiness.blockers.length === 0).length
  return `${b.items.length} รายวิชา · ${students} นักศึกษา · พร้อมใช้งาน ${ready}/${b.items.length}`
}

export type CourseActions = {
  copy: (c: Course) => void
  edit: (c: Course) => void
  dup: (c: Course) => void
  del: (c: Course) => void
}

/** Column heads of the table view; the last one is the actions column. */
export const COURSE_TABLE_HEADS = [
  "รหัส",
  "รายวิชา",
  "หน่วยกิต",
  "เกรด",
  "วิธีตัดเกรด",
  "ผู้สอน",
  "นศ.",
  "สถานะ",
  "",
]
