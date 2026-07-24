import { lazy, type ComponentType, type LazyExoticComponent } from "react"

const Login = lazy(() => import("./pages/auth/Login.tsx"))
const Users = lazy(() => import("./pages/admin/Users.tsx"))
const CourseList = lazy(() => import("./pages/courses/CourseList.tsx"))
const Home = lazy(() => import("./pages/Home.tsx"))

export type AppRoute = {
  path: string
  element: LazyExoticComponent<ComponentType>
}

// Route table consumed by App.tsx — add each new page here as it's built.
export const routes: AppRoute[] = [
  { path: "/", element: Home },
  { path: "/auth/login", element: Login },
  { path: "/admin/users", element: Users },
  { path: "/courses", element: CourseList },
]
