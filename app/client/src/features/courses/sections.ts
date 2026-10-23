/**
 * The pages inside a course (`ROUTES` level "course" in index-q.html) and the
 * setup steps that lead through them (`STEP_HOME`). The list pane, the step
 * bar and the search palette all read these, so a page has one label.
 */
import type { IconName } from "../../components/Icon.tsx"
import type { Course } from "./course.types.ts"

export type CourseSection = {
  id: string
  label: string
  /** Relative to /courses/:courseId. */
  path: string
  icon: IconName
  group: "top" | "setup" | "result"
  count?: (c: Course) => number
}

export const COURSE_SECTIONS: CourseSection[] = [
  { id: "overview", label: "ภาพรวม", path: "", icon: "gauge", group: "top" },
  {
    id: "clos",
    label: "CLO",
    path: "clos",
    icon: "target",
    group: "setup",
    count: (c) => c.counts.clos,
  },
  { id: "objectives", label: "จุดประสงค์", path: "objectives", icon: "check", group: "setup" },
  {
    id: "activities",
    label: "กิจกรรมและวิธีประเมิน",
    path: "activities",
    icon: "link",
    group: "setup",
    count: (c) => c.counts.activities,
  },
  {
    id: "roster",
    label: "นักศึกษาและคะแนน",
    path: "roster",
    icon: "people",
    group: "setup",
    count: (c) => c.counts.students,
  },
  { id: "results", label: "ผลรายนักศึกษา", path: "results", icon: "chart", group: "result" },
  { id: "grading", label: "การตัดเกรด", path: "grading", icon: "award", group: "result" },
]

export const GROUP_LABEL = { setup: "ตั้งค่ารายวิชา", result: "ผลลัพธ์" } as const

/**
 * The six setup steps. Each has one fixed home page; the activities page is
 * home to two (its list and its matrix view). "ผู้สอน" is hidden once the
 * course has an instructor (U10) — which a course always has after creation.
 */
export const SETUP_STEPS = [
  { key: "staff", label: "ผู้สอน", what: "เพิ่มอาจารย์ผู้สอนของรายวิชา", path: null, view: null },
  {
    key: "clo",
    label: "CLO และน้ำหนัก",
    what: "เขียน CLO และน้ำหนักตามแผนของแต่ละข้อ",
    path: "clos",
    view: null,
  },
  {
    key: "obj",
    label: "จุดประสงค์",
    what: "แตก CLO เป็นจุดประสงค์ที่วัดได้ น้ำหนักรวม 100% ต่อ CLO",
    path: "objectives",
    view: null,
  },
  {
    key: "act",
    label: "กิจกรรมและวิธีประเมิน",
    what: "เพิ่มกิจกรรม เลือกจุดประสงค์ที่วัด สัดส่วนรวม 100%",
    path: "activities",
    view: "list",
  },
  {
    key: "crit",
    label: "ตรวจการเชื่อมกับ CLO",
    what: "ตรวจว่าทุกกิจกรรมเชื่อมกับ CLO ครบ",
    path: "activities",
    view: "matrix",
  },
  {
    key: "roster",
    label: "นักศึกษาและคะแนน",
    what: "เพิ่มรายชื่อ แล้วกรอกหรือนำเข้าคะแนน",
    path: "roster",
    view: null,
  },
] as const

export type SetupStep = (typeof SETUP_STEPS)[number]

export const courseLabel = (c: Pick<Course, "code" | "section" | "semester" | "year">) =>
  `${c.code} · Sec ${c.section} · ภาค ${c.semester}/${c.year}`
