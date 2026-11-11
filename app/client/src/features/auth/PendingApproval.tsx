import { authPrimary } from "./auth.ui.ts"

/** Body of the "waiting for an ADMIN" view, the same for Google and the e-mail link. */
export default function PendingApproval({ email, onBack }: { email: string; onBack: () => void }) {
  return (
    <div className="space-y-4">
      {email && (
        <div className="flex flex-wrap items-center gap-2 rounded-[10px] bg-wash px-3 py-2.5 text-sm">
          <span>{email}</span>
          <span className="rounded-full bg-warn-bg px-2 py-0.5 text-xs text-warn">รออนุมัติ</span>
        </div>
      )}
      <p className="text-sm leading-relaxed text-ink-soft">
        ได้รับอนุมัติแล้ว กลับมาเข้าสู่ระบบอีกครั้ง
      </p>
      <button type="button" className={authPrimary} onClick={onBack}>
        ใช้บัญชีอื่น (บัญชีของคณะ)
      </button>
    </div>
  )
}
