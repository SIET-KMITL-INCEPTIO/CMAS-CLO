/**
 * The list pane (`paintList`): the caller's courses grouped by term, newest
 * first; the open course expands into its pages. Resizable, width remembered.
 */
import { useMemo, useRef, useState } from "react"
import { Link, matchPath, useLocation, useNavigate } from "react-router-dom"
import { useAuthStore } from "../../features/auth/useAuthStore.ts"
import { byTerm, useCourseList } from "../../features/courses/useCourses.ts"
import { COURSE_SECTIONS, GROUP_LABEL } from "../../features/courses/sections.ts"
import type { Course } from "../../features/courses/course.types.ts"
import { useCan } from "../../hooks/useCan.ts"
import { Icon } from "../Icon.tsx"
import { useDisplay } from "./display.ts"

/** Which course and which of its pages the URL is on. */
function useHere() {
  const { pathname } = useLocation()
  const m = matchPath("/courses/:courseId/*", pathname)
  const courseId = m?.params.courseId
  const rest = m?.params["*"] ?? ""
  const section = COURSE_SECTIONS.find((s) => s.path === rest.split("/")[0]) ?? COURSE_SECTIONS[0]!
  return { courseId, sectionId: courseId ? section.id : null }
}

function CourseRow({
  c,
  open,
  active,
  sectionId,
  onToggle,
}: {
  c: Course
  open: boolean
  active: boolean
  sectionId: string | null
  onToggle: () => void
}) {
  let lastGroup = "top"
  return (
    <div className="team">
      <button
        type="button"
        className="teamrow"
        aria-current={active ? "true" : undefined}
        onClick={onToggle}
      >
        <span className="caret">{open ? "▾" : "▸"}</span>
        <span className="tavatar">{c.code.slice(-3)}</span>
        <span className="min-w-0 flex-1">
          <span className="tname block truncate">{c.name}</span>
          <span className="tmeta">
            Sec {c.section} · {c.semester}/{c.year}
          </span>
        </span>
      </button>
      {open &&
        COURSE_SECTIONS.map((s) => {
          const head = s.group !== lastGroup && s.group !== "top" ? GROUP_LABEL[s.group] : null
          lastGroup = s.group
          return (
            <div key={s.id}>
              {head && <div className="changroup">{head}</div>}
              <Link
                to={`/courses/${c.id}/${s.path}`}
                className="chan"
                aria-current={active && sectionId === s.id ? "page" : undefined}
              >
                {s.label}
                <span className="n">{s.count ? s.count(c) : ""}</span>
              </Link>
            </div>
          )
        })}
    </div>
  )
}

export function CoursePane({ onNavigate }: { onNavigate: () => void }) {
  const { data, isLoading } = useCourseList()
  const role = useAuthStore((s) => s.me?.role)
  const can = useCan()
  const navigate = useNavigate()
  const { courseId, sectionId } = useHere()
  const [filter, setFilter] = useState("")
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const { listw, set } = useDisplay()
  const rsz = useRef<HTMLDivElement>(null)

  // The course in the URL is open in the tree unless the user folded it.
  const isOpen = (id: string) => expanded[id] ?? id === courseId

  const groups = useMemo(() => {
    const q = filter.trim().toLowerCase()
    const rows = [...(data?.courses ?? [])]
      .sort(byTerm)
      .filter((c) => !q || `${c.code} ${c.name} ${c.section} ${c.year}`.toLowerCase().includes(q))
    const out: { term: string; courses: Course[] }[] = []
    for (const c of rows) {
      const term = `ภาค ${c.semester}/${c.year}`
      if (out.at(-1)?.term !== term) out.push({ term, courses: [] })
      out.at(-1)!.courses.push(c)
    }
    return out
  }, [data, filter])

  const startResize = (e: React.PointerEvent) => {
    const startX = e.clientX
    const startW = listw
    document.body.classList.add("resizing")
    rsz.current?.classList.add("drag")
    const move = (ev: PointerEvent) => set({ listw: startW + ev.clientX - startX })
    const up = () => {
      document.body.classList.remove("resizing")
      rsz.current?.classList.remove("drag")
      window.removeEventListener("pointermove", move)
      window.removeEventListener("pointerup", up)
    }
    window.addEventListener("pointermove", move)
    window.addEventListener("pointerup", up)
  }

  const total = data?.courses.length ?? 0
  return (
    <aside
      className="listpane no-print"
      aria-label="รายการรายวิชา"
      onClick={(e) => (e.target as HTMLElement).closest("a") && onNavigate()}
    >
      <div className="lphead">
        <span className="lptitle">{role === "ADMIN" ? "รายวิชาทั้งหมด" : "รายวิชาของฉัน"}</span>
        {can("course.create") && (
          <button type="button" className="lpadd" onClick={() => navigate("/courses?new=1")}>
            <Icon name="plus" className="h-3.5 w-3.5" />
            <span>สร้างรายวิชา</span>
          </button>
        )}
      </div>
      <div className="lpsearch">
        <input
          className="inp !py-1.5 text-[14px]"
          placeholder="กรองรายการ"
          aria-label="กรองรายการ"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>
      <div className="lplist">
        {isLoading && <div className="px-3 py-8 text-center text-[14px] text-dim">กำลังโหลด…</div>}
        {!isLoading && total === 0 && (
          <div className="px-4 py-8 text-center text-[14px] leading-relaxed text-dim">
            ยังไม่มีรายวิชาในความดูแลของคุณ
            <br />
            สร้างรายวิชาเอง หรือรอผู้ดูแลระบบมอบหมาย
          </div>
        )}
        {total > 0 && groups.length === 0 && (
          <div className="px-3 py-8 text-center text-[14px] text-dim">
            ไม่พบรายวิชาที่ตรงกับคำค้น
          </div>
        )}
        {groups.map((g) => (
          <div key={g.term}>
            <div className="changroup !mt-3 !ml-0">{g.term}</div>
            {g.courses.map((c) => (
              <CourseRow
                key={c.id}
                c={c}
                open={isOpen(c.id)}
                active={c.id === courseId}
                sectionId={sectionId}
                onToggle={() => setExpanded((e) => ({ ...e, [c.id]: !isOpen(c.id) }))}
              />
            ))}
          </div>
        ))}
      </div>
      <div
        ref={rsz}
        className="rsz"
        role="separator"
        aria-orientation="vertical"
        aria-label="ปรับความกว้าง"
        onPointerDown={startResize}
      />
    </aside>
  )
}
