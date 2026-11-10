import { useEffect, useRef, useState, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import { GOOGLE_CLIENT_ID } from "../../lib/app.constants.ts"
import { authApi } from "./auth.api.ts"
import {
  authInput,
  authPrimary,
  authSecondary,
  PENDING_SUBTITLE,
  PENDING_TITLE,
} from "./auth.ui.ts"
import AuthCard from "./AuthCard.tsx"
import PendingApproval from "./PendingApproval.tsx"
import { useAuthStore } from "./useAuthStore.ts"

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

const RESEND_SECONDS = 60

export default function Login() {
  const buttonRef = useRef<HTMLDivElement>(null)
  // FR-08: an address outside the faculty domain waits for an ADMIN, whichever way
  // it signed in. A view state, not a route: there is no token yet, so a reloaded
  // URL could not say which account it was about.
  const [pendingEmail, setPendingEmail] = useState<string | null>(null)
  const [email, setEmail] = useState("")
  // The address a sign-in link was sent to; set means the "check your email" view.
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState("")
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setTimeout(() => setCooldown((seconds) => seconds - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  const sendLink = async (address: string) => {
    setSubmitting(true)
    try {
      // apiClient toasts a failure itself.
      await authApi.requestEmailLink(address)
      setSentTo(address)
      setCooldown(RESEND_SECONDS)
    } catch {
      // already shown as a toast
    } finally {
      setSubmitting(false)
    }
  }

  const submitEmail = (event: FormEvent) => {
    event.preventDefault()
    const trimmed = email.trim().toLowerCase()
    if (!/^\S+@\S+\.\S+$/.test(trimmed)) return setFormError("กรอกอีเมลให้ถูกต้อง")
    setFormError("")
    void sendLink(trimmed)
  }

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return

    const handleCredential = async (response: { credential: string }) => {
      // The 401 case (invalid token / deactivated account) is handled by
      // apiClient itself — it toasts and throws, so nothing else to do here.
      const result = await authApi.loginWithGoogle(response.credential)
      if (!result) return

      if (result.status === "PENDING") {
        setPendingEmail(emailFromCredential(response.credential))
        return
      }

      setAuth(result.user, result.accessToken)
      navigate("/")
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
        text: "signin_with",
        width: 280,
      })
    }
    tryInit()

    return () => {
      cancelled = true
    }
  }, [navigate, setAuth])

  const title =
    pendingEmail !== null ? PENDING_TITLE : sentTo !== null ? "ตรวจสอบอีเมลของคุณ" : "เข้าสู่ระบบ"
  const subtitle =
    pendingEmail !== null
      ? PENDING_SUBTITLE
      : sentTo !== null
        ? `ถ้า ${sentTo} ลงทะเบียนได้ ระบบส่งลิงก์เข้าสู่ระบบไปแล้ว ลิงก์ใช้ได้ครั้งเดียวและหมดอายุใน 24 ชั่วโมง`
        : "ระบบประเมินผลลัพธ์การเรียนรู้ระดับรายวิชา"

  return (
    <AuthCard title={title} subtitle={subtitle}>
      {pendingEmail !== null && (
        <PendingApproval email={pendingEmail} onBack={() => setPendingEmail(null)} />
      )}

      {sentTo !== null && pendingEmail === null && (
        <div className="space-y-4">
          <button
            type="button"
            className={authSecondary}
            disabled={cooldown > 0 || submitting}
            onClick={() => void sendLink(sentTo)}
          >
            {cooldown > 0 ? `ส่งลิงก์อีกครั้งได้ในอีก ${cooldown} วินาที` : "ส่งลิงก์อีกครั้ง"}
          </button>
          <button
            type="button"
            className="w-full text-center text-sm text-ink-soft underline underline-offset-2"
            onClick={() => setSentTo(null)}
          >
            ใช้อีเมลอื่น
          </button>
        </div>
      )}

      {/* Kept mounted while pending: Google renders its button into this div once. */}
      <div className={pendingEmail !== null || sentTo !== null ? "hidden" : "flex flex-col gap-4"}>
        {GOOGLE_CLIENT_ID ? (
          <div ref={buttonRef} className="flex justify-center" />
        ) : (
          <p className="text-sm text-ink-soft">ยังไม่ได้ตั้งค่า VITE_GOOGLE_CLIENT_ID</p>
        )}

        <div className="flex items-center gap-3 text-[13px] text-ink-soft">
          <span className="h-px flex-1 bg-edge" />
          หรือใช้อีเมลของคณะ
          <span className="h-px flex-1 bg-edge" />
        </div>

        <form onSubmit={submitEmail} className="flex flex-col gap-4" noValidate>
          <div>
            <label htmlFor="login-email" className="mb-1.5 block text-sm text-ink2">
              อีเมล
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={formError ? true : undefined}
              className={authInput}
            />
          </div>
          {formError && (
            <p role="alert" className="text-sm text-bad">
              {formError}
            </p>
          )}
          <button type="submit" disabled={submitting} className={authPrimary}>
            ส่งลิงก์เข้าสู่ระบบ
          </button>
        </form>
      </div>
    </AuthCard>
  )
}
