import { Navigate } from "react-router-dom"
import { PageState } from "../../components/page/PageState.tsx"
import { byTerm, useCourseList } from "../courses/useCourses.ts"

/**
 * "รายวิชา" in the rail lands here: the newest course's overview, or the
 * course manager when the caller has no course yet.
 */
export default function Home() {
  const { data, isLoading, error, refetch } = useCourseList()
  if (isLoading || error) {
    return (
      <div className="cbody">
        <PageState loading={isLoading} error={error} onRetry={() => void refetch()} what="รายวิชา">
          {null}
        </PageState>
      </div>
    )
  }
  const first = [...(data?.courses ?? [])].sort(byTerm)[0]
  return <Navigate to={first ? `/courses/${first.id}` : "/courses"} replace />
}
