import { useEffect, useRef, useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { authApi } from "./auth.api.ts"
import { authSecondary, PENDING_SUBTITLE, PENDING_TITLE } from "./auth.ui.ts"
import AuthCard from "./AuthCard.tsx"
import PendingApproval from "./PendingApproval.tsx"
import { useAuthStore } from "./useAuthStore.ts"

type View = "checking" | "pending" | "failed"

/**
 * Where the link in the sign-in e-mail lands: /auth/verify?token=…
 * Same outcome as Google: ACTIVE signs in, PENDING waits for an ADMIN (FR-08).
 */
export default function Verify() {
  const [params] = useSearchParams()
  const token = params.get("token") ?? ""
  const [view, setView] = useState<View>(token ? "checking" : "failed")
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)
  // A link works once; StrictMode runs effects twice in development.
  const started = useRef(false)

  useEffect(() => {
    if (!token || started.current) return
    started.current = true
    authApi
      .verifyEmailLink(token)
      .then((result) => {
        if (!result) return setView("failed")
        if (result.status === "PENDING") return setView("pending")
        setAuth(result.user, result.accessToken)
        navigate("/", { replace: true })
      })
      .catch(() => setView("failed")) // apiClient already toasted the reason
  }, [token, navigate, setAuth])

  if (view === "pending") {
    return (
      <AuthCard title={PENDING_TITLE} subtitle={PENDING_SUBTITLE}>
        <PendingApproval email="" onBack={() => navigate("/auth/login")} />
      </AuthCard>
    )
  }

  if (view === "failed") {
    return (
      <AuthCard title="ลิงก์ใช้ไม่ได้" subtitle="ลิงก์ใช้ได้ครั้งเดียวและหมดอายุใน 24 ชั่วโมง">
        <Link to="/auth/login" className={`${authSecondary} text-center`}>
          ขอลิงก์ใหม่
        </Link>
      </AuthCard>
    )
  }

  return (
    <AuthCard title="กำลังเข้าสู่ระบบ" subtitle="รอสักครู่">
      <div />
    </AuthCard>
  )
}
