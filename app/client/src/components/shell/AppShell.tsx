/**
 * The Teams-shaped frame of index-q.html: command bar across the top, app
 * rail, list pane of courses, and the content pane where each page renders.
 * Below 1024 px the list pane slides over the content; below 640 px the rail
 * becomes a bottom bar (CSS in styles/atelier.css).
 */
import { useEffect, useState } from "react"
import { Outlet, useLocation } from "react-router-dom"
import { CoursePane } from "./CoursePane.tsx"
import { Rail } from "./Rail.tsx"
import { TopBar } from "./TopBar.tsx"

export function AppShell() {
  const { pathname } = useLocation()
  // The list pane belongs to the course area; account management has none yet (F7).
  const showPane = !pathname.startsWith("/admin/")
  const [paneOpen, setPaneOpen] = useState(false)

  useEffect(() => {
    document.body.dataset.pane = paneOpen ? "open" : "closed"
  }, [paneOpen])

  return (
    <div className={`app ${showPane ? "" : "no-pane"}`}>
      <TopBar onTogglePane={() => setPaneOpen((o) => !o)} />
      <Rail />
      {showPane && <CoursePane onNavigate={() => setPaneOpen(false)} />}
      <div className="paneScrim no-print" onClick={() => setPaneOpen(false)} aria-hidden="true" />
      <main className="content">
        <Outlet />
      </main>
    </div>
  )
}
