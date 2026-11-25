/**
 * Ctrl K (`modalPalette`): type, pick, go. Searches the caller's own courses
 * in the term the list pane shows, the pages of each, and the system pages —
 * nothing is fetched here that the list pane has not already loaded. An empty
 * box lists the courses only; their pages appear once something is typed.
 */
import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuthStore } from "../../features/auth/useAuthStore.ts"
import { COURSE_SECTIONS } from "../../features/courses/sections.ts"
import { byTerm, useCourseList } from "../../features/courses/useCourses.ts"
import { Modal } from "../overlay/Sheet.tsx"
import { ALL, effectiveTerm, inTerm, termLabel, termsOf, useTermFilter } from "./termFilter.ts"

type Hit = { key: string; label: string; meta: string; to: string }

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState("")
  const [active, setActive] = useState(0)
  const { data } = useCourseList()
  const me = useAuthStore((s) => s.me)
  const navigate = useNavigate()
  const saved = useTermFilter((s) => s.term)

  const term = effectiveTerm(saved, termsOf(data?.courses ?? []))

  const hits = useMemo<Hit[]>(() => {
    const needle = q.trim().toLowerCase()
    const courses = data?.courses ?? []
    const all: Hit[] = [
      { key: "manage", label: "จัดการรายวิชา", meta: "ระบบ", to: "/courses" },
      ...(me?.role === "ADMIN"
        ? [{ key: "users", label: "จัดการผู้ใช้งาน", meta: "ระบบ", to: "/admin/users" }]
        : []),
    ]
    for (const c of [...courses].filter(inTerm(term)).sort(byTerm)) {
      all.push({
        key: c.id,
        label: `${c.code} ${c.name}`,
        meta: `Sec ${c.section} · ${c.semester}/${c.year}`,
        to: `/courses/${c.id}`,
      })
      if (!needle) continue
      for (const s of COURSE_SECTIONS.slice(1)) {
        all.push({
          key: `${c.id}-${s.id}`,
          label: `${s.label} · ${c.name}`,
          meta: c.code,
          to: `/courses/${c.id}/${s.path}`,
        })
      }
    }
    return (
      needle ? all.filter((h) => `${h.label} ${h.meta}`.toLowerCase().includes(needle)) : all
    ).slice(0, 30)
  }, [data, me, q, term])

  const go = (h: Hit | undefined) => {
    if (!h) return
    onClose()
    setQ("")
    navigate(h.to)
  }

  return (
    <Modal open={open} onClose={onClose} title="ค้นหา">
      <input
        className="inp"
        value={q}
        placeholder="รหัสวิชา ชื่อวิชา หรือชื่อหน้า"
        aria-label="ค้นหา"
        onChange={(e) => {
          setQ(e.target.value)
          setActive(0)
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") setActive((a) => Math.min(a + 1, hits.length - 1))
          else if (e.key === "ArrowUp") setActive((a) => Math.max(a - 1, 0))
          else if (e.key === "Enter") go(hits[active])
          else return
          e.preventDefault()
        }}
      />
      {term !== ALL && (
        <p className="mt-2 text-[12.5px] text-dim">
          แสดงเฉพาะ{termLabel(term)} · เปลี่ยนได้ที่รายการรายวิชาด้านซ้าย
        </p>
      )}
      <ul className="mt-3 grid gap-0.5" role="listbox" aria-label="ผลการค้นหา">
        {hits.map((h, i) => (
          <li key={h.key}>
            <button
              type="button"
              role="option"
              aria-selected={i === active}
              className={`acctitem justify-between ${i === active ? "bg-wash" : ""}`}
              onMouseEnter={() => setActive(i)}
              onClick={() => go(h)}
            >
              <span className="truncate">{h.label}</span>
              <span className="shrink-0 text-[12.5px] text-dim">{h.meta}</span>
            </button>
          </li>
        ))}
        {hits.length === 0 && (
          <li className="px-2.5 py-6 text-center text-[14px] text-dim">ไม่พบ</li>
        )}
      </ul>
    </Modal>
  )
}
