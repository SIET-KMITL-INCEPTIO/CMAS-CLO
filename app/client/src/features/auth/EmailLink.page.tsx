import { useEffect, useRef, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { apiClient, ApiError } from "../../lib/apiClient.ts"
import { startSession } from "../../lib/session.ts"
import { AuthError, AuthHead, AuthPending } from "./AuthCard.tsx"
import type { User } from "../../types/user.types.ts"

// Mirrors AuthController.verifyEmailLink. The refresh token arrives as an httpOnly cookie (S-2).
type VerifyResponse =
  | { status: "PENDING"; email: string; message: string }
  | { status: "ACTIVE"; user: User; accessToken: string }

type State =
  { name: "checking" } | { name: "pending"; email: string } | { name: "failed"; message: string }

/**
 * /auth/link#<token> — where the emailed link lands (FR-07). The token is in
 * the fragment, so it never reaches a server log; it is read once, wiped from
 * the address bar, and spent with POST /auth/email-link/verify.
 */
export default function EmailLink() {
  const navigate = useNavigate()
  const [state, setState] = useState<State>({ name: "checking" })
  // A link works once: StrictMode's second mount in development must not spend it twice.
  const spent = useRef(false)

  useEffect(() => {
    if (spent.current) return
    spent.current = true
    const token = window.location.hash.slice(1)
    window.history.replaceState(null, "", window.location.pathname)

    void (async () => {
      try {
        const r = await apiClient.post<VerifyResponse>("/auth/email-link/verify", { token })
        if (r.status === "PENDING") return setState({ name: "pending", email: r.email })
        await startSession(r.accessToken)
        navigate("/", { replace: true })
      } catch (err) {
        setState({
          name: "failed",
          message:
            err instanceof ApiError && err.status === 403
              ? err.message // FR-03: suspended, said only now the mailbox is proven
              : err instanceof ApiError && err.status === 429
                ? "เปิดลิงก์บ่อยเกินไป — รอสักครู่แล้วลองใหม่"
                : err instanceof ApiError && (err.status === 400 || err.status === 401)
                  ? "ลิงก์นี้ใช้ไปแล้วหรือหมดอายุ — ขอลิงก์ใหม่"
                  : (err as Error).message,
        })
      }
    })()
  }, [navigate])

  return (
    <div className="authscreen">
      <div className="authcard">
        {state.name === "checking" && <AuthHead title="กำลังเข้าสู่ระบบ…" />}
        {state.name === "pending" && (
          <AuthPending email={state.email} onOther={() => navigate("/auth/login")} />
        )}
        {state.name === "failed" && (
          <>
            <AuthHead title="เข้าสู่ระบบไม่สำเร็จ" />
            <AuthError text={state.message} />
            <Link to="/auth/login" className="btn btn-primary w-full justify-center !py-2.5">
              กลับไปหน้าเข้าสู่ระบบ
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
