/**
 * Everything under /courses/:courseId: loads the course once and hands it to
 * the page through the outlet context. A course the caller cannot see answers
 * 404 exactly like one that does not exist (A-13), and so does this screen.
 */
import { Link, Outlet, useParams } from "react-router-dom"
import { PageState } from "../../components/page/PageState.tsx"
import { ApiError } from "../../lib/apiClient.ts"
import type { CourseContext } from "./useCourseContext.ts"
import { useCourse } from "./useCourses.ts"

export function CourseLayout() {
  const { courseId } = useParams()
  const { data: course, isLoading, error, refetch } = useCourse(courseId)

  const gone = error instanceof ApiError && error.status === 404
  if (isLoading || (error && !gone)) {
    return (
      <div className="cbody">
        <PageState loading={isLoading} error={error} onRetry={() => void refetch()} what="รายวิชา">
          {null}
        </PageState>
      </div>
    )
  }
  if (gone || !course) {
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
