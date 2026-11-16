import { useEffect, useRef, useState, type FormEvent } from "react"
import { Navigate, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { apiClient, ApiError } from "../../lib/apiClient.ts"
import { pictureFromCredential, savePicture } from "../../lib/avatar.ts"
import { GOOGLE_CLIENT_ID } from "../../lib/app.constants.ts"
import { startSession } from "../../lib/session.ts"
import { AuthError, AuthHead, AuthPending } from "./AuthCard.tsx"
import { useAuthStore } from "./useAuthStore.ts"
import type { User } from "../../types/user.types.ts"

// Mirrors AuthController.loginWithGoogle's two 200 shapes (auth.controller.ts).
// The refresh token is not here: it arrives as an httpOnly cookie (S-2).
type GoogleLoginResponse =
  { status: "PENDING"; message: string } | { status: "ACTIVE"; user: User; accessToken: string }

/** FR-07: the server sends one link per email per 60 seconds; the button waits as long. */
const RESEND_MS = 60_000
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

/**
 * The email in a Google ID token, for display on the pending screen only. The
 * server verified the token; nothing here is trusted for access.
 */
function emailFromCredential(credential: string): string {
  try {
    const payload = credential.split(".")[1] ?? ""
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
    const email: unknown = (JSON.parse(json) as { email?: unknown }).email
    return typeof email === "string" ? email : ""
  } catch {
    return ""
  }
}

type View = { name: "login" } | { name: "sent"; email: string } | { name: "pending"; email: string }

/**
 * เข้าสู่ระบบ — index-q.html's auth screen: Google (FR-08) or a one-time link
 * by email (FR-07). No password anywhere.
 */
export default function Login() {
  const buttonRef = useRef<HTMLDivElement>(null)
  // A view state, not a route: there is no token yet, so a reloaded URL could
  // not say which account it was about.
  const [view, setView] = useState<View>({ name: "login" })
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [sending, setSending] = useState(false)
  const [resendAt, setResendAt] = useState(0)
  const [now, setNow] = useState(() => Date.now())
  const navigate = useNavigate()
  const status = useAuthStore((s) => s.status)

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return

    const handleCredential = async (response: { credential: string }) => {
      try {
        const result = await apiClient.post<GoogleLoginResponse>("/auth/google", {
          idToken: response.credential,
        })
        if (result.status === "PENDING") {
          setView({ name: "pending", email: emailFromCredential(response.credential) })
          return
        }
        savePicture(result.user.id, pictureFromCredential(response.credential))
        await startSession(result.accessToken)
        navigate("/", { replace: true })
      } catch (err) {
        // One message for a forged token, a wrong audience and a switched-off account (FR-03).
        toast.error(
          err instanceof ApiError && err.status === 401
            ? "เข้าสู่ระบบไม่สำเร็จ"
            : (err as Error).message,
        )
      }
    }

    // index.html loads the Google Identity Services script with `async
    // defer`, so it can still be missing when this effect first runs —
    // poll briefly instead of assuming load order.
    let cancelled = false
    const tryInit = () => {
      if (cancelled) return
      if (!window.google || !buttonRef.current) {
        setTimeout(tryInit, 100)
        return
      }
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredential,
      })
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: "outline",
        size: "large",
        text: "continue_with",
        width: 340,
      })
    }
    tryInit()
    return () => {
      cancelled = true
    }
  }, [navigate])

  // The resend countdown only ticks while it is on screen.
  const waiting = view.name === "sent" && now < resendAt
  useEffect(() => {
    if (!waiting) return
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [waiting])

  const sendLink = async (to: string) => {
    setSending(true)
    setError("")
    try {
      await apiClient.post<{ message: string }>("/auth/email-link", { email: to })
      setView({ name: "sent", email: to })
      setResendAt(Date.now() + RESEND_MS)
      setNow(Date.now())
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 429
          ? "ขอลิงก์บ่อยเกินไป — รอสักครู่แล้วลองใหม่"
          : err instanceof ApiError && err.status === 400
            ? "กรอกอีเมลให้ถูกต้อง"
            : (err as Error).message,
      )
    } finally {
      setSending(false)
    }
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    const to = email.trim().toLowerCase()
    if (!EMAIL_RE.test(to)) return setError("กรอกอีเมลให้ถูกต้อง")
    void sendLink(to)
  }

  const backToLogin = () => {
    setView({ name: "login" })
    setError("")
  }

  if (status === "in") return <Navigate to="/" replace />

  const wait = Math.max(0, Math.ceil((resendAt - now) / 1000))

  return (
    <div className="authscreen">
      <div className="authcard">
        {view.name === "pending" && <AuthPending email={view.email} onOther={backToLogin} />}

        {view.name === "sent" && (
          <>
            <AuthHead
              title="ตรวจสอบอีเมลของคุณ"
              sub={
                <>
                  ถ้า <b className="font-medium text-ink">{view.email}</b> ลงทะเบียนได้
                  ระบบส่งลิงก์เข้าสู่ระบบไปแล้ว · ลิงก์ใช้ได้ครั้งเดียวและหมดอายุใน 24 ชั่วโมง
                </>
              }
            />
            {error && <AuthError text={error} />}
            <button
              type="button"
              className="btn w-full justify-center"
              disabled={wait > 0 || sending}
              onClick={() => void sendLink(view.email)}
            >
              {wait > 0 ? `ส่งลิงก์อีกครั้งได้ในอีก ${wait} วินาที` : "ส่งลิงก์อีกครั้ง"}
            </button>
            <div className="text-center text-[14px] text-dim">
              <button type="button" className="authlink" onClick={backToLogin}>
                ใช้อีเมลอื่น
              </button>
            </div>
          </>
        )}

        {/* Kept mounted on every view: Google renders its button into this div once. */}
        <div className={view.name === "login" ? "flex flex-col gap-4" : "hidden"}>
          <AuthHead title="เข้าสู่ระบบ" sub="ระบบประเมินผลลัพธ์การเรียนรู้ระดับรายวิชา" />
          {GOOGLE_CLIENT_ID ? (
            <div ref={buttonRef} className="flex min-h-[44px] justify-center" />
          ) : (
            <p className="text-[14px] text-bad">ยังไม่ได้ตั้งค่า VITE_GOOGLE_CLIENT_ID</p>
          )}
          <div className="author">หรือใช้อีเมล</div>
          <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
            {error && <AuthError text={error} />}
            <div>
              <label className="mb-1.5 block text-[14px] text-ink2" htmlFor="au-email">
                อีเมล
              </label>
              <input
                id="au-email"
                className="inp"
                type="email"
                autoComplete="username"
                placeholder="name@kmitl.ac.th"
                value={email}
                aria-invalid={error ? true : undefined}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary w-full justify-center !py-2.5"
              disabled={sending}
            >
              {sending ? "กำลังส่ง…" : "ส่งลิงก์เข้าสู่ระบบ"}
            </button>
          </form>
          <p className="text-center text-[13px] leading-relaxed text-dim">
            ไม่มีรหัสผ่าน · อีเมลนอกคณะต้องรอผู้ดูแลระบบอนุมัติ
          </p>
        </div>
      </div>
    </div>
  )
}
