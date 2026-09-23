import { useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { apiClient } from "../../lib/apiClient.ts"
import { GOOGLE_CLIENT_ID } from "../../lib/app.constants.ts"
import { useAuthStore } from "./useAuthStore.ts"
import type { User } from "../../types/user.types.ts"

// Mirrors AuthController.loginWithGoogle's two 200 shapes (auth.controller.ts).
type GoogleLoginResponse =
  | { status: "PENDING"; message: string }
  | { status: "ACTIVE"; user: User; accessToken: string; refreshToken: string }

export default function Login() {
  const buttonRef = useRef<HTMLDivElement>(null)
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
        toast.info(result.message)
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
        <h1 className="mb-4 text-lg font-medium">เข้าสู่ระบบ</h1>
        {/* TODO: email + password form (react-hook-form + zod + POST /auth/login) */}

        {GOOGLE_CLIENT_ID ? (
          <div ref={buttonRef} className="flex justify-center" />
        ) : (
          <p className="text-sm text-gray-500">ยังไม่ได้ตั้งค่า VITE_GOOGLE_CLIENT_ID</p>
        )}
      </div>
    </div>
  )
}
