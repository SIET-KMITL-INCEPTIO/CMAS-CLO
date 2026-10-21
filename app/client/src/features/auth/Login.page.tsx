import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { apiClient } from "../../lib/apiClient.ts"
import { GOOGLE_CLIENT_ID } from "../../lib/app.constants.ts"
import { useAuthStore } from "./useAuthStore.ts"
import type { User } from "../../types/user.types.ts"

// Mirrors AuthController.loginWithGoogle's two 200 shapes (auth.controller.ts).
type GoogleLoginResponse =
  | { status: "PENDING"; message: string }
  | { status: "ACTIVE"; user: User; accessToken: string; refreshToken: string }

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
  const setAuth = useAuthStore((state) => state.setAuth)

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return

    const handleCredential = async (response: { credential: string }) => {
      // The 401 case (invalid token / deactivated account) is handled by
      // apiClient itself — it toasts and throws, so nothing else to do here.
      const result = await apiClient.post<GoogleLoginResponse>("/auth/google", {
        idToken: response.credential,
      })
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

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm rounded-xl border p-6 shadow-sm">
        {pendingEmail !== null && (
          <div className="space-y-4">
            <div>
              <h1 className="text-lg font-medium">รอผู้ดูแลระบบอนุมัติ</h1>
              <p className="mt-1 text-sm text-gray-500">
                อีเมลนี้ไม่ใช่อีเมลของคณะ จึงต้องได้รับอนุมัติก่อนเข้าใช้งาน
              </p>
            </div>
            {pendingEmail && (
              <div className="flex flex-wrap items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm">
                <span>{pendingEmail}</span>
                <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-800">
                  รออนุมัติ
                </span>
              </div>
            )}
            <p className="text-sm text-gray-500">
              ได้รับอนุมัติแล้ว กลับมาเข้าสู่ระบบด้วย Google อีกครั้ง
            </p>
            <button
              type="button"
              className="w-full rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
              onClick={() => setPendingEmail(null)}
            >
              ใช้บัญชีอื่น (บัญชีของคณะ)
            </button>
          </div>
        )}

        {/* Kept mounted while pending: Google renders its button into this div once. */}
        <div className={pendingEmail !== null ? "hidden" : undefined}>
          <h1 className="mb-4 text-lg font-medium">เข้าสู่ระบบ</h1>
          {/* TODO: email + password form (react-hook-form + zod + POST /auth/login) */}

          {GOOGLE_CLIENT_ID ? (
            <div ref={buttonRef} className="flex justify-center" />
          ) : (
            <p className="text-sm text-gray-500">ยังไม่ได้ตั้งค่า VITE_GOOGLE_CLIENT_ID</p>
          )}
        </div>
      </div>
    </div>
  )
}
