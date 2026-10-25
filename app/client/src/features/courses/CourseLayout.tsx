/**
 * Everything under /courses/:courseId: loads the course once and hands it to
 * the page through the outlet context. A course the caller cannot see answers
 * 404 exactly like one that does not exist (A-13), and so does this screen.
 */
import { Link, Outlet, useParams } from "react-router-dom"
import type { CourseContext } from "./useCourseContext.ts"
import { useCourse } from "./useCourses.ts"

export function CourseLayout() {
  const { courseId } = useParams()
  const { data: course, isLoading, isError } = useCourse(courseId)

  if (isLoading) return <div className="cbody text-[14px] text-dim">กำลังโหลด…</div>
  if (isError || !course) {
    return (
      <div className="cbody">
        <div className="card mx-auto mt-10 max-w-md p-6 text-center">
          <div className="text-[18px] text-ink">ไม่พบรายวิชา</div>
          <p className="mt-1 text-[14px] text-soft">
            รายวิชานี้ไม่มีอยู่ หรือคุณไม่ได้เป็นผู้สอนของรายวิชานี้
          </p>
          <Link to="/courses" className="btn mt-4 inline-block">
            ไปที่จัดการรายวิชา
          </Link>
        </div>
      </div>
    )
  }
  return <Outlet context={{ course } satisfies CourseContext} />
}
