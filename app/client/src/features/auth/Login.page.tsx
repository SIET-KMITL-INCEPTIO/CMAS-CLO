import { useEffect, useRef, useState } from "react"
import { Navigate, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { apiClient, ApiError } from "../../lib/apiClient.ts"
import { pictureFromCredential, savePicture } from "../../lib/avatar.ts"
import { GOOGLE_CLIENT_ID } from "../../lib/app.constants.ts"
import { startSession } from "../../lib/session.ts"
import { useAuthStore } from "./useAuthStore.ts"
import type { User } from "../../types/user.types.ts"

// Mirrors AuthController.loginWithGoogle's two 200 shapes (auth.controller.ts).
// The refresh token is not here: it arrives as an httpOnly cookie (S-2).
type GoogleLoginResponse =
  { status: "PENDING"; message: string } | { status: "ACTIVE"; user: User; accessToken: string }

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

export default function Login() {
  const buttonRef = useRef<HTMLDivElement>(null)
  // FR-08: a Google account outside the faculty domain waits for an ADMIN.
  // A view state, not a route: there is no token yet, so a reloaded URL could
  // not say which account it was about.
  const [pendingEmail, setPendingEmail] = useState<string | null>(null)
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
          setPendingEmail(emailFromCredential(response.credential))
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
        text: "signin_with",
        width: 300,
      })
    }
    tryInit()
    return () => {
      cancelled = true
    }
  }, [navigate])

  if (status === "in") return <Navigate to="/" replace />

  return (
    <div className="authscreen">
      <div className="authcard">
        <div className="text-[13px] text-dim">&lt;/&gt; CMAS</div>

        {pendingEmail !== null && (
          <>
            <div>
              <h1 className="text-[22px] font-light text-ink">รอผู้ดูแลระบบอนุมัติ</h1>
              <p className="mt-1 text-[14px] text-soft">
                อีเมลนี้ไม่ใช่อีเมลของคณะ จึงต้องได้รับอนุมัติก่อนเข้าใช้งาน
              </p>
            </div>
            {pendingEmail && (
              <div className="flex flex-wrap items-center gap-2 rounded-sm bg-wash px-3 py-2 text-[14px]">
                <span className="text-ink">{pendingEmail}</span>
                <span className="rounded-full border border-warnBd bg-warnBg px-2 py-0.5 text-[12px] text-warn">
                  รออนุมัติ
                </span>
              </div>
            )}
            <p className="text-[14px] text-soft">
              ได้รับอนุมัติแล้ว กลับมาเข้าสู่ระบบด้วย Google อีกครั้ง
            </p>
            <button type="button" className="btn w-full" onClick={() => setPendingEmail(null)}>
              ใช้บัญชีอื่น (บัญชีของคณะ)
            </button>
          </>
        )}

        {/* Kept mounted while pending: Google renders its button into this div once. */}
        <div className={pendingEmail !== null ? "hidden" : "flex flex-col gap-4"}>
          <div>
            <h1 className="text-[22px] font-light text-ink">เข้าสู่ระบบ</h1>
            <p className="mt-1 text-[14px] text-soft">ระบบติดตามผลลัพธ์การเรียนรู้ระดับรายวิชา</p>
          </div>
          {GOOGLE_CLIENT_ID ? (
            <div ref={buttonRef} className="flex justify-center" />
          ) : (
            <p className="text-[14px] text-bad">ยังไม่ได้ตั้งค่า VITE_GOOGLE_CLIENT_ID</p>
          )}
        </div>
      </div>
    </div>
  )
}
