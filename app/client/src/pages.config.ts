import { lazy, type ComponentType, type LazyExoticComponent } from "react"

const Login = lazy(() => import("./features/auth/Login.page.tsx"))
const Users = lazy(() => import("./features/users/Users.page.tsx"))
const CourseList = lazy(() => import("./features/courses/CourseList.page.tsx"))
const Home = lazy(() => import("./features/home/Home.page.tsx"))

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
