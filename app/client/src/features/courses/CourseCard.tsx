import { useNavigate } from "react-router-dom"
import { Icon, type IconName } from "../../components/Icon.tsx"
import { Pill } from "../../components/ui/Badges.tsx"
import { TONE } from "../../components/ui/tone.ts"
import { useCan } from "../../hooks/useCan.ts"
import type { CourseWithReadiness } from "./course.types.ts"
import { courseHref, readyChip, staffLine, type CourseActions } from "./courseListParts.tsx"
import { creditLabel, METHOD_TH, SCALE_TH } from "./courseView.ts"

/** One course as a card: open it, and the actions this account may take on it. */
export function CourseCard({ c, act }: { c: CourseWithReadiness; act: CourseActions }) {
  const can = useCan(c)
  const navigate = useNavigate()
  const btn = (icon: IconName, label: string, onClick: () => void, danger = false) => (
    <button
      type="button"
      className={`cact ${danger ? "is-danger" : ""}`}
      onClick={onClick}
      title={label}
      aria-label={`${label} · ${c.code} Sec ${c.section}`}
    >
      <Icon name={icon} />
    </button>
  )
  return (
    <div className="ccard">
      <button type="button" className="ccard-main" onClick={() => navigate(courseHref(c))}>
        <span className="tavatar">{c.code.slice(-3)}</span>
        <span className="min-w-0 flex-1">
          <span className="ccard-name">{c.name}</span>
          <span className="ccard-meta">
            {c.code} · Sec {c.section} · ภาค {c.semester}/{c.year}
          </span>
        </span>
        <span
          className="tdot mt-1.5"
          style={{ background: c.readiness.blockers.length ? TONE.bad.bar : TONE.ok.bar }}
          title={c.readiness.blockers.length ? "ยังตั้งค่าไม่ครบ" : "พร้อมใช้งาน"}
        />
      </button>
      <div className="ccard-facts">
        <Pill>{creditLabel(c)}</Pill>
        <Pill>{SCALE_TH[c.gradeScale]}</Pill>
        <Pill>{METHOD_TH[c.gradeMethod]}</Pill>
        <Pill>{c.counts.students} นศ.</Pill>
        {readyChip(c)}
      </div>
      <div className="truncate px-[14px] pb-2.5 text-[12.5px] text-dim">{staffLine(c)}</div>
      <div className="ccard-foot no-print">
        {btn("link", "คัดลอกลิงก์", () => act.copy(c))}
        {(can("course.settings") || can("staff.write")) &&
          btn("edit", "แก้ไขรายวิชานี้", () => act.edit(c))}
        {can("course.create") &&
          btn("copy", "ทำสำเนาเป็น Sec ใหม่ พร้อม CLO จุดประสงค์ และกิจกรรม", () => act.dup(c))}
        <span className="flex-1" />
        {can("course.delete") && btn("trash", "ลบรายวิชานี้", () => act.del(c), true)}
      </div>
    </div>
  )
}
