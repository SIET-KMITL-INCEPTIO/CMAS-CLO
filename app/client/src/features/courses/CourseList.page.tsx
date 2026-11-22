/**
 * จัดการรายวิชา — viewCourses of index-q.html. Cards read well when looking
 * for a course, the table when comparing them; both show the same rows.
 * Every action button checks the course it sits on, not the one on screen (SEC-3).
 */
import { useMemo, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { toast } from "sonner"
import { PageHeader } from "../../components/page/PageHeader.tsx"
import { useCan } from "../../hooks/useCan.ts"
import type { Course } from "./course.types.ts"
import { CopyLevel } from "./CopyLevel.tsx"
import { CourseForm } from "./CourseForm.tsx"
import { CourseListBody } from "./CourseListBody.tsx"
import { courseHref, type CourseActions } from "./courseListParts.tsx"
import { readPref, writePref, type View } from "./coursePrefs.ts"
import { bucketsOf, COURSE_GROUPBY, currentTerm, type GroupBy } from "./courseView.ts"
import { DeleteCourse } from "./DeleteCourse.tsx"
import { byTerm, useCourseList, useDuplicateCourse } from "./useCourses.ts"

export default function CourseList() {
  const list = useCourseList()
  const can = useCan()
  const [params, setParams] = useSearchParams()
  const [pref, setPref] = useState(readPref)
  const [filter, setFilter] = useState("")
  const [editing, setEditing] = useState<Course | null>(null)
  const [deleting, setDeleting] = useState<Course | null>(null)
  const [copyingLevel, setCopyingLevel] = useState(false)
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

  const act: CourseActions = {
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
            {can("course.create") && all.length > 0 && (
              <button type="button" className="btn" onClick={() => setCopyingLevel(true)}>
                ยกโครงทั้งชั้นปี
              </button>
            )}
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
            CLO จุดประสงค์ และกิจกรรม แต่ไม่รวมนักศึกษาและคะแนน ·
            ยกโครงทั้งชั้นปีคัดลอกทุกวิชาของชั้นปีนั้นตามแผนการเรียนของหลักสูตร
            ไปปีการศึกษาถัดไปในครั้งเดียว
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

            <CourseListBody
              shown={shown}
              buckets={buckets}
              view={pref.view}
              group={pref.group}
              filter={filter}
              act={act}
            />
          </>
        )}
      </div>

      {copyingLevel && (
        <CopyLevel
          years={[...new Set(all.map((c) => c.year))]}
          onClose={() => setCopyingLevel(false)}
        />
      )}
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
