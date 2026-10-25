import { lazy, type ComponentType, type LazyExoticComponent } from "react"

const Login = lazy(() => import("./features/auth/Login.page.tsx"))
const Home = lazy(() => import("./features/home/Home.page.tsx"))
const CourseList = lazy(() => import("./features/courses/CourseList.page.tsx"))
const Users = lazy(() => import("./features/users/Users.page.tsx"))
const CourseOverview = lazy(() => import("./features/courses/CourseOverview.page.tsx"))
const Clos = lazy(() => import("./features/clos/Clos.page.tsx"))
const Objectives = lazy(() => import("./features/clos/Objectives.page.tsx"))
const Activities = lazy(() => import("./features/activities/Activities.page.tsx"))
const Roster = lazy(() => import("./features/students/Roster.page.tsx"))
const Results = lazy(() => import("./features/dashboard/Results.page.tsx"))
const Grading = lazy(() => import("./features/grading/Grading.page.tsx"))

export type AppRoute = {
  path: string
  element: LazyExoticComponent<ComponentType>
}

// Route tables consumed by App.tsx — add each new page here as it's built.
// Paths follow index-q.html's pages (frontend-plan.md §2); its hash routes
// (#clos/c1) became paths (/courses/:courseId/clos).

/** Reachable signed out. */
export const publicRoutes: AppRoute[] = [{ path: "/auth/login", element: Login }]

/** Inside the app frame, signed in. */
export const appRoutes: AppRoute[] = [
  { path: "/", element: Home },
  { path: "/courses", element: CourseList },
  { path: "/admin/users", element: Users },
]

/** Inside one course: relative to /courses/:courseId, the course loaded by CourseLayout. */
export const courseRoutes: AppRoute[] = [
  { path: "", element: CourseOverview },
  { path: "clos", element: Clos },
  { path: "objectives", element: Objectives },
  { path: "activities", element: Activities },
  { path: "roster", element: Roster },
  { path: "results", element: Results },
  { path: "grading", element: Grading },
]
