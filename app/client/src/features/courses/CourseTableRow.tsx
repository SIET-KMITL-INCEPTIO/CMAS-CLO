import { Link, useNavigate } from "react-router-dom"
import { Pill } from "../../components/ui/Badges.tsx"
import { useCan } from "../../hooks/useCan.ts"
import type { CourseWithReadiness } from "./course.types.ts"
import { courseHref, readyChip, staffLine, type CourseActions } from "./courseListParts.tsx"
import { creditLabel, METHOD_TH, SCALE_TH } from "./courseView.ts"

/** One course as a table row. Buttons stop the row's click, so "แก้ไข" does not also open the course. */
export function CourseTableRow({ c, act }: { c: CourseWithReadiness; act: CourseActions }) {
  const can = useCan(c)
  const navigate = useNavigate()
  const quiet = "btn btn-quiet !px-2 !py-0.5"
  return (
    <tr className="rowlink" onClick={() => navigate(courseHref(c))}>
      <td className="tnum text-[14px] whitespace-nowrap">{c.code}</td>
      <td>
        <div className="text-[14px]">{c.name}</div>
        <div className="text-[13px] whitespace-nowrap text-dim">
          Sec {c.section} · ภาค {c.semester}/{c.year}
        </div>
      </td>
      <td className="tnum text-[13px] whitespace-nowrap">{creditLabel(c)}</td>
      <td>
        <Pill>{SCALE_TH[c.gradeScale]}</Pill>
      </td>
      <td>
        <Pill>{METHOD_TH[c.gradeMethod]}</Pill>
      </td>
      <td className="text-[14px]">{staffLine(c)}</td>
      <td className="num tnum">{c.counts.students}</td>
      <td>{readyChip(c)}</td>
      {/* Buttons stop the row's click, so "แก้ไข" does not also open the course. */}
      <td
        className="no-print text-[13px] whitespace-nowrap text-dim"
        onClick={(e) => e.stopPropagation()}
      >
        <Link className="deeplink" to={courseHref(c)}>
          เปิดรายวิชา ›
        </Link>
        <button type="button" className={`${quiet} ml-1`} onClick={() => act.copy(c)}>
          คัดลอกลิงก์
        </button>
        {(can("course.settings") || can("staff.write")) && (
          <button type="button" className={`${quiet} ml-1`} onClick={() => act.edit(c)}>
            แก้ไข
          </button>
        )}
        {can("course.create") && (
          <button type="button" className={`${quiet} ml-1`} onClick={() => act.dup(c)}>
            ทำสำเนา
          </button>
        )}
        {can("course.delete") && (
          <button type="button" className={`${quiet} btn-danger ml-2`} onClick={() => act.del(c)}>
            ลบ
          </button>
        )}
      </td>
    </tr>
  )
}
