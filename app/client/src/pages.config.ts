import { createElement, use, type ComponentType } from "react"
import { matchPath } from "react-router-dom"

type Module = { default: ComponentType }
type Load = () => Promise<Module>
export type Page = ComponentType & { load: Load }

/**
 * A page in its own file, like React.lazy, with two differences (NFR-01):
 * `load()` starts the download before React asks for it, and once the file
 * is in, the page renders at once. React.lazy suspends on its first render
 * even then, and React holds a revealed Suspense boundary back ~300 ms.
 * A failed download is not cached: the next render tries again.
 */
export function page(loader: Load): Page {
  let loaded: Module | undefined
  let pending: Promise<Module> | undefined
  const load = () =>
    (pending ??= loader().then(
      (m) => (loaded = m),
      (err: unknown) => {
        pending = undefined
        throw err
      },
    ))
  function LazyPage() {
    return createElement((loaded ?? use(load())).default)
  }
  return Object.assign(LazyPage, { load })
}

const Login = page(() => import("./features/auth/Login.page.tsx"))
const EmailLink = page(() => import("./features/auth/EmailLink.page.tsx"))
const Home = page(() => import("./features/home/Home.page.tsx"))
const CourseList = page(() => import("./features/courses/CourseList.page.tsx"))
const Users = page(() => import("./features/users/Users.page.tsx"))
const CourseOverview = page(() => import("./features/courses/CourseOverview.page.tsx"))
const Clos = page(() => import("./features/clos/Clos.page.tsx"))
const Objectives = page(() => import("./features/clos/Objectives.page.tsx"))
const Activities = page(() => import("./features/activities/Activities.page.tsx"))
const Roster = page(() => import("./features/students/Roster.page.tsx"))
const Results = page(() => import("./features/dashboard/Results.page.tsx"))
const Grading = page(() => import("./features/grading/Grading.page.tsx"))
const ExcelLink = page(() => import("./features/excel/ExcelLink.page.tsx"))

export type AppRoute = {
  path: string
  element: Page
}

// Route tables consumed by App.tsx — add each new page here as it's built.
// Paths follow index-q.html's pages (frontend-plan.md §2); its hash routes
// (#clos/c1) became paths (/courses/:courseId/clos).

/** Reachable signed out. */
export const publicRoutes: AppRoute[] = [
  { path: "/auth/login", element: Login },
  // FR-07: the emailed link, /auth/link#<token>.
  { path: "/auth/link", element: EmailLink },
]

/** Inside the app frame, signed in. */
export const appRoutes: AppRoute[] = [
  { path: "/", element: Home },
  { path: "/courses", element: CourseList },
  { path: "/admin/users", element: Users },
  // FR-73: the CMAS add-in for Excel sends the instructor here with a code to type.
  { path: "/excel/link", element: ExcelLink },
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

/**
 * NFR-01: start downloading the page's own file at once, beside the session
 * and the course. React would ask for it only after CourseLayout has the
 * course, one more round trip at the end of a reload. A path no page matches
 * fetches nothing; a failed fetch is left for React to retry and report.
 */
export function preloadPage(pathname: string) {
  const inCourse = matchPath("/courses/:courseId/*", pathname)
  const candidates = inCourse
    ? courseRoutes.map((r) => ({ ...r, path: `/courses/:courseId${r.path ? `/${r.path}` : ""}` }))
    : [...publicRoutes, ...appRoutes]
  const hit = candidates.find((r) => matchPath(r.path, pathname))
  hit?.element.load().catch(() => undefined)
}
