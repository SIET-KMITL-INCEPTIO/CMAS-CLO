import { Suspense, useEffect } from "react"
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom"
import { Toaster } from "sonner"
import { AppShell } from "./components/shell/AppShell.tsx"
import { useAuthStore } from "./features/auth/useAuthStore.ts"
import { CourseLayout } from "./features/courses/CourseLayout.tsx"
import { resumeSession } from "./lib/session.ts"
import { appRoutes, courseRoutes, publicRoutes } from "./pages.config.ts"

const Loading = () => (
  <div className="grid min-h-screen place-items-center text-[14px] text-dim">กำลังโหลด…</div>
)

/** Signed-in routes only. A reload resumes the session from the refresh cookie first. */
function RequireSession() {
  const status = useAuthStore((s) => s.status)
  const location = useLocation()
  if (status === "checking") return <Loading />
  if (status === "out")
    return <Navigate to="/auth/login" replace state={{ from: location.pathname }} />
  return <Outlet />
}

export default function App() {
  useEffect(() => {
    void resumeSession()
  }, [])

  return (
    <BrowserRouter>
      <Toaster
        position="bottom-right"
        toastOptions={{ unstyled: true, classNames: { toast: "toast", error: "bad" } }}
      />
      <Suspense fallback={<Loading />}>
        <Routes>
          {publicRoutes.map(({ path, element: Page }) => (
            <Route key={path} path={path} element={<Page />} />
          ))}
          <Route element={<RequireSession />}>
            <Route element={<AppShell />}>
              {appRoutes.map(({ path, element: Page }) => (
                <Route key={path} path={path} element={<Page />} />
              ))}
              <Route path="/courses/:courseId" element={<CourseLayout />}>
                {courseRoutes.map(({ path, element: Page }) =>
                  path === "" ? (
                    <Route key="index" index element={<Page />} />
                  ) : (
                    <Route key={path} path={path} element={<Page />} />
                  ),
                )}
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
