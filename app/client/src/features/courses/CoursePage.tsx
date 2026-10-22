/**
 * The frame of every page inside a course: head, the setup step bar when this
 * page is a setup step's home (W1 — result pages do not carry it), then body.
 */
import type { ReactNode } from "react"
import { Link, useLocation, useSearchParams } from "react-router-dom"
import { PageHeader } from "../../components/page/PageHeader.tsx"
import { useCourseContext } from "./useCourseContext.ts"
import { courseLabel, SETUP_STEPS } from "./sections.ts"

// U10 — "ผู้สอน" is not a step once the course has an instructor, which it always does.
const STEPS = SETUP_STEPS.filter((s) => s.path !== null)

/** The steps whose home is the page in the URL (the activities page is home to two). */
function useStepsHere(courseId: string) {
  const { pathname } = useLocation()
  const [params] = useSearchParams()
  const rest = pathname.replace(`/courses/${courseId}`, "").replace(/^\//, "")
  return STEPS.map((s, i) => ({ s, i })).filter(
    ({ s }) => s.path === rest && (!s.view || s.view === (params.get("view") ?? "list")),
  )
}

function StepBar({ courseId, here }: { courseId: string; here: number[] }) {
  return (
    <div className="stepbar no-print">
      <nav className="stepper" aria-label="ขั้นตอนตั้งค่ารายวิชา">
        {STEPS.map((s, i) => (
          <Link
            key={s.key}
            to={`/courses/${courseId}/${s.path}${s.view ? `?view=${s.view}` : ""}`}
            className="stp"
            aria-current={here.includes(i) ? "page" : undefined}
            title={s.what}
          >
            <span className="num">{i + 1}</span>
            <span className="lb">
              <span className="block text-ink">{s.label}</span>
            </span>
          </Link>
        ))}
      </nav>
    </div>
  )
}

type Props = { title: string; tools?: ReactNode; help?: ReactNode; children: ReactNode }

export function CoursePage({ title, tools, help, children }: Props) {
  const { course } = useCourseContext()
  const here = useStepsHere(course.id)
  // L1 — on a setup page the line under the title says what to do here.
  const sub = here.length ? here.map(({ s }) => s.what).join(" แล้ว ") : courseLabel(course)
  return (
    <>
      <PageHeader title={title} sub={sub} tools={tools} help={help} />
      {here.length > 0 && <StepBar courseId={course.id} here={here.map((h) => h.i)} />}
      <div className="cbody">{children}</div>
    </>
  )
}
