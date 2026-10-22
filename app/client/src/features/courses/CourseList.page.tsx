/**
 * จัดการรายวิชา — viewCourses of index-q.html. Cards read well when looking
 * for a course, the table when comparing them; both show the same rows.
 * Every action button checks the course it sits on, not the one on screen (SEC-3).
 */
import { useMemo, useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { toast } from "sonner"
import { Icon, type IconName } from "../../components/Icon.tsx"
import { PageHeader } from "../../components/page/PageHeader.tsx"
import { Chip, Pill } from "../../components/ui/Badges.tsx"
import { TONE } from "../../components/ui/tone.ts"
import { useCan } from "../../hooks/useCan.ts"
import type { Course, CourseWithReadiness } from "./course.types.ts"
import { CourseForm } from "./CourseForm.tsx"
import {
  bucketsOf,
  COURSE_GROUPBY,
  creditLabel,
  currentTerm,
  METHOD_TH,
  SCALE_TH,
  type Bucket,
  type GroupBy,
} from "./courseView.ts"
import { DeleteCourse } from "./DeleteCourse.tsx"
import { byTerm, useCourseList, useDuplicateCourse } from "./useCourses.ts"

type View = "card" | "table"
const PREF = "cmas.courses"

function readPref(): { group: GroupBy; view: View } {
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
function writePref(p: { group: GroupBy; view: View }) {
  try {
    localStorage.setItem(PREF, JSON.stringify(p))
  } catch {
    /* private window — the choice lasts this visit only */
  }
}

const courseHref = (c: Course) => `/courses/${c.id}`

function staffLine(c: Course) {
  const [first, ...rest] = c.instructors
  if (!first) return <span className="text-bad">ยังไม่มีผู้สอน</span>
  return (
    <>
      {first.name}
      {rest.length > 0 && <span className="text-dim"> +{rest.length}</span>}
    </>
  )
}

const readyChip = (c: CourseWithReadiness) =>
  c.readiness.blockers.length ? (
    <Chip tone="bad" title={c.readiness.blockers.join(" · ")}>
      {c.readiness.blockers.length} ข้อค้าง
    </Chip>
  ) : (
    <Chip tone="ok">พร้อม</Chip>
  )

function bucketNote(b: Bucket<CourseWithReadiness>) {
  const students = b.items.reduce((t, c) => t + c.counts.students, 0)
  const ready = b.items.filter((c) => c.readiness.blockers.length === 0).length
  return `${b.items.length} รายวิชา · ${students} นักศึกษา · พร้อมใช้งาน ${ready}/${b.items.length}`
}

type Actions = {
  copy: (c: Course) => void
  edit: (c: Course) => void
  dup: (c: Course) => void
  del: (c: Course) => void
}

function CourseCard({ c, act }: { c: CourseWithReadiness; act: Actions }) {
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

function CourseRow({ c, act }: { c: CourseWithReadiness; act: Actions }) {
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

const HEADS = ["รหัส", "รายวิชา", "หน่วยกิต", "เกรด", "วิธีตัดเกรด", "ผู้สอน", "นศ.", "สถานะ", ""]

export default function CourseList() {
  const list = useCourseList()
  const can = useCan()
  const [params, setParams] = useSearchParams()
  const [pref, setPref] = useState(readPref)
  const [filter, setFilter] = useState("")
  const [editing, setEditing] = useState<Course | null>(null)
  const [deleting, setDeleting] = useState<Course | null>(null)
  const dup = useDuplicateCourse()
  const navigate = useNavigate()
  const creating = params.get("new") === "1"

  const choose = (p: Partial<typeof pref>) => {
    const next = { ...pref, ...p }
    setPref(next)
    writePref(next)
  }
  const openCreate = () => setParams({ new: "1" })
  const closeCreate = () => setParams({}, { replace: true })

  const all = useMemo(() => list.data?.courses ?? [], [list.data])
  const shown = useMemo(() => {
    const q = filter.trim().toLowerCase()
    return all
      .filter(
        (c) =>
          !q ||
          `${c.code} ${c.name} ${c.section} ${c.year} ${c.semester}`.toLowerCase().includes(q),
      )
      .sort((a, b) => (a.code + a.section).localeCompare(b.code + b.section))
  }, [all, filter])
  const buckets = useMemo(() => bucketsOf(shown, pref.group), [shown, pref.group])
  // New courses start in the newest term on screen — the one being set up.
  const term = useMemo(() => {
    const newest = [...all].sort(byTerm)[0]
    return newest ? { semester: newest.semester, year: newest.year } : currentTerm()
  }, [all])

  const act: Actions = {
    copy: (c) => {
      const url = `${location.origin}${courseHref(c)}`
      navigator.clipboard.writeText(url).then(
        () => toast.success("คัดลอกลิงก์แล้ว"),
        () => toast.error(`คัดลอกไม่สำเร็จ — ${url}`),
      )
    },
    edit: setEditing,
    dup: (c) =>
      dup.mutate(c.id, {
        onSuccess: (n) =>
          toast.success(
            `ทำสำเนาเป็น ${n.code} Sec ${n.section} แล้ว — นักศึกษาและคะแนนไม่ได้คัดลอกไป`,
          ),
        onError: (err) => toast.error(err.message),
      }),
    del: (c) => {
      setEditing(null)
      setDeleting(c)
    },
  }

  const chipSet = <T extends string>(
    label: string,
    opts: [T, string][],
    cur: T,
    pick: (v: T) => void,
  ) => (
    <span className="flex flex-wrap items-center gap-1.5">
      <span className="text-dim">{label}</span>
      {opts.map(([v, l]) => (
        <button
          key={v}
          type="button"
          className="chipbtn"
          aria-current={v === cur ? "true" : undefined}
          onClick={() => pick(v)}
        >
          {l}
        </button>
      ))}
    </span>
  )

  const none = pref.group === "none"
  const cards = (items: CourseWithReadiness[]) => (
    <div className="cgrid">
      {items.map((c) => (
        <CourseCard key={c.id} c={c} act={act} />
      ))}
    </div>
  )

  return (
    <>
      <PageHeader
        title="จัดการรายวิชา"
        sub="ระดับระบบ"
        tools={
          <>
            <input
              className="inp !w-64"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="ค้นหารหัส ชื่อ Sec หรือปี"
              aria-label="ค้นหารายวิชา"
            />
            {can("course.create") && (
              <button type="button" className="btn btn-primary" onClick={openCreate}>
                สร้างรายวิชา
              </button>
            )}
          </>
        }
        help={
          <>
            ผู้สอนเห็นเฉพาะรายวิชาที่ตนสอน ผู้ดูแลระบบเห็นทุกรายวิชา · ทำสำเนาจะได้ Sec ใหม่พร้อม
            CLO จุดประสงค์ และกิจกรรม แต่ไม่รวมนักศึกษาและคะแนน
          </>
        }
      />
      <div className="cbody space-y-4">
        {list.isLoading ? (
          <div className="text-[14px] text-dim">กำลังโหลดรายวิชา…</div>
        ) : all.length === 0 ? (
          <div className="card px-6 py-10 text-center">
            <div className="text-[16px] text-ink">ยังไม่มีรายวิชาในความดูแลของคุณ</div>
            <div className="mt-1.5 text-[14px] text-dim">
              ผู้ดูแลระบบเป็นผู้มอบหมายผู้สอนประจำรายวิชา
              {can("course.create") &&
                " · ระหว่างนี้สร้างรายวิชาเองได้ และคุณจะเป็นผู้สอนของรายวิชานั้น"}
            </div>
            {can("course.create") && (
              <button type="button" className="btn btn-primary mt-4" onClick={openCreate}>
                สร้างรายวิชา
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px]">
              {chipSet(
                "จัดกลุ่มตาม",
                COURSE_GROUPBY.map((g) => [g.id, g.label] as [GroupBy, string]),
                pref.group,
                (group) => choose({ group }),
              )}
              {chipSet<View>(
                "แสดงเป็น",
                [
                  ["card", "การ์ด"],
                  ["table", "ตาราง"],
                ],
                pref.view,
                (view) => choose({ view }),
              )}
              <span className="ml-auto text-dim">
                {shown.length === all.length
                  ? `${all.length} รายวิชา`
                  : `${shown.length} จาก ${all.length} รายวิชา`}
              </span>
            </div>

            {shown.length === 0 ? (
              <div className="text-[14px] text-dim">ไม่พบรายวิชาที่ตรงกับ “{filter}”</div>
            ) : pref.view === "card" ? (
              none ? (
                cards(shown)
              ) : (
                buckets.map((b) => (
                  <section key={b.key}>
                    <div className="cgrouptitle">
                      <span className="text-[16px] text-ink">{b.head}</span>
                      <span className="text-[13px] text-dim">{bucketNote(b)}</span>
                    </div>
                    {cards(b.items)}
                  </section>
                ))
              )
            ) : (
              <div className="card overflow-x-auto">
                <table className="dt">
                  <thead>
                    <tr>
                      {HEADS.map((h, i) => (
                        <th key={i} className={h === "นศ." ? "num" : undefined}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {none
                      ? shown.map((c) => <CourseRow key={c.id} c={c} act={act} />)
                      : buckets.flatMap((b) => [
                          <tr key={`h-${b.key}`} className="cgrouphead">
                            <td colSpan={HEADS.length}>
                              <span className="text-[14px] text-ink">{b.head}</span>
                              <span className="text-[13px] text-dim"> · {bucketNote(b)}</span>
                            </td>
                          </tr>,
                          ...b.items.map((c) => <CourseRow key={c.id} c={c} act={act} />),
                        ])}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {creating && (
        <CourseForm
          course={null}
          term={term}
          onClose={closeCreate}
          onCreated={(c) => navigate(courseHref(c))}
        />
      )}
      {editing && (
        <CourseForm
          course={editing}
          term={term}
          onClose={() => setEditing(null)}
          onDelete={act.del}
        />
      )}
      {deleting && (
        <DeleteCourse
          course={deleting}
          onClose={() => setDeleting(null)}
          onDeleted={() => setDeleting(null)}
        />
      )}
    </>
  )
}
