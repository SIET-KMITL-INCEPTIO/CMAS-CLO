/**
 * The app rail (`AREAS` in index-q.html): areas of the system, not pages of a
 * course. "จัดการรายวิชา" is the one specific page and wins over its area.
 */
import { Link, useLocation } from "react-router-dom"
import { useAuthStore } from "../../features/auth/useAuthStore.ts"
import { Icon, type IconName } from "../Icon.tsx"

type Area = { id: string; label: string; icon: IconName; to: string; admin?: boolean }

const AREAS: Area[] = [
  { id: "courses", label: "รายวิชา", icon: "book", to: "/" },
  { id: "manage", label: "จัดการรายวิชา", icon: "grid", to: "/courses" },
  { id: "users", label: "ผู้ใช้", icon: "user", to: "/admin/users", admin: true },
]

function areaOf(path: string) {
  if (path === "/courses") return "manage"
  if (path.startsWith("/admin/users")) return "users"
  return "courses"
}

export function Rail() {
  const role = useAuthStore((s) => s.me?.role)
  const now = areaOf(useLocation().pathname)
  return (
    <nav className="apprail no-print" aria-label="พื้นที่ใช้งาน">
      {AREAS.filter((a) => !a.admin || role === "ADMIN").map((a) => (
        <Link
          key={a.id}
          to={a.to}
          className="arl"
          title={a.label}
          aria-current={now === a.id ? "page" : undefined}
        >
          <Icon name={a.icon} className="" />
          <span>{a.label}</span>
        </Link>
      ))}
    </nav>
  )
}
