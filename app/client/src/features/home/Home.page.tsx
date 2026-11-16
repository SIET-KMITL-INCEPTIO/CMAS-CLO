import { Navigate } from "react-router-dom"
import { byTerm, useCourseList } from "../courses/useCourses.ts"

/**
 * "รายวิชา" in the rail lands here: the newest course's overview, or the
 * course manager when the caller has no course yet.
 */
export default function Home() {
  const { data, isLoading } = useCourseList()
  if (isLoading) return <div className="cbody text-[14px] text-dim">กำลังโหลด…</div>
  const first = [...(data?.courses ?? [])].sort(byTerm)[0]
  return <Navigate to={first ? `/courses/${first.id}` : "/courses"} replace />
}
