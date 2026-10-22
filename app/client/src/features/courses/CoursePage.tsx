/**
 * The frame of every page inside a course: head, the setup step bar when this
 * page is a setup step's home (W1 — result pages do not carry it), the body,
 * and on a setup page the step footer (back / next).
 */
import type { ReactNode } from "react"
import { Link, useLocation, useSearchParams } from "react-router-dom"
import { PageHeader } from "../../components/page/PageHeader.tsx"
import { TONE } from "../../components/ui/tone.ts"
import { useCourseContext } from "./useCourseContext.ts"
import { courseLabel, SETUP_STEPS } from "./sections.ts"
import { READY, type StepKey, type StepState } from "./setupSteps.ts"
import { useSetupSteps } from "./useSetupSteps.ts"

// U10 — "ผู้สอน" is not a step once the course has an instructor, which it always does.
const STEPS = SETUP_STEPS.filter((s) => s.path !== null)
type Step = (typeof STEPS)[number]

const stepHref = (courseId: string, s: Step) =>
  `/courses/${courseId}/${s.path}${s.view ? `?view=${s.view}` : ""}`

/** The steps whose home is the page in the URL (the activities page is home to two). */
function useStepsHere(courseId: string) {
  const { pathname } = useLocation()
  const [params] = useSearchParams()
  const rest = pathname.replace(`/courses/${courseId}`, "").replace(/^\//, "")
  return STEPS.map((s, i) => ({ s, i })).filter(
    ({ s }) => s.path === rest && (!s.view || s.view === (params.get("view") ?? "list")),
  )
}

type States = Record<StepKey, { state: StepState; detail: string }> | null

function StepBar({ courseId, here, states }: { courseId: string; here: number[]; states: States }) {
  // data-now — the first step still unmet, i.e. what to do next (may differ from the page shown).
  const now = states ? STEPS.findIndex((s) => states[s.key as StepKey].state !== "ok") : -1
  return (
    <div className="stepbar no-print">
      <nav className="stepper" aria-label="ขั้นตอนตั้งค่ารายวิชา">
        {STEPS.map((s, i) => {
          const st = states?.[s.key as StepKey]
          const tone = st ? TONE[READY[st.state].tone] : null
          return (
            <Link
              key={s.key}
              to={stepHref(courseId, s)}
              className="stp"
              aria-current={here.includes(i) ? "page" : undefined}
              data-now={i === now ? "1" : undefined}
              title={st ? `${s.label} — ${st.detail}` : s.what}
            >
              {/* K4 — the number stays: whoever follows the steps needs to know which one this is. */}
              <span
                className="num"
                style={tone ? { background: tone.bg, color: tone.tx } : undefined}
              >
                {i + 1}
              </span>
              <span className="lb">
                <span className="block text-ink">
                  {s.label}
                  {st?.state === "ok" && <span className="text-ok"> ✓</span>}
                </span>
                {st && st.state !== "ok" && (
                  <span className="block truncate text-[12px]" style={{ color: tone?.tx }}>
                    {READY[st.state].label}
                  </span>
                )}
              </span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

function StepFooter({ courseId, here }: { courseId: string; here: number[] }) {
  const first = here[0]!
  const last = here[here.length - 1]!
  const prev = first > 0 ? STEPS[first - 1] : null
  const next = last < STEPS.length - 1 ? STEPS[last + 1] : null
  return (
    <div className="stepfoot no-print">
      {prev ? (
        <Link className="btn" to={stepHref(courseId, prev)}>
          ← ขั้นที่ {first} · {prev.label}
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link className="btn btn-primary" to={stepHref(courseId, next)}>
          ขั้นที่ {last + 2} · {next.label} →
        </Link>
      ) : (
        <Link className="btn btn-primary" to={`/courses/${courseId}`}>
          ดูภาพรวม →
        </Link>
      )}
    </div>
  )
}

type Props = { title: string; tools?: ReactNode; help?: ReactNode; children: ReactNode }

export function CoursePage({ title, tools, help, children }: Props) {
  const { course } = useCourseContext()
  const here = useStepsHere(course.id)
  const setup = here.length > 0
  // L1 — on a setup page the line under the title says what to do here.
  const sub = setup ? here.map(({ s }) => s.what).join(" แล้ว ") : courseLabel(course)
  return (
    <>
      <PageHeader title={title} sub={sub} tools={tools} help={help} />
      {setup && <SetupBar courseId={course.id} here={here.map((h) => h.i)} />}
      <div className="cbody">
        {children}
        {setup && <StepFooter courseId={course.id} here={here.map((h) => h.i)} />}
      </div>
    </>
  )
}

/** Reads the states only on setup pages: result pages never pay for the three requests. */
function SetupBar({ courseId, here }: { courseId: string; here: number[] }) {
  const { course } = useCourseContext()
  const states = useSetupSteps(course)
  return <StepBar courseId={courseId} here={here} states={states} />
}
