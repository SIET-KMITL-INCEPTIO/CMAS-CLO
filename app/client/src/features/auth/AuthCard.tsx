import type { ReactNode } from "react"

/** The pieces the sign-in screens share: heading, error line, the pending card. */
export function AuthError({ text }: { text: string }) {
  return (
    <div className="rounded-lg bg-badBg px-3 py-2 text-[14px] text-bad" role="alert">
      {text}
    </div>
  )
}

export function AuthHead({ title, sub }: { title: string; sub?: ReactNode }) {
  return (
    <div>
      <div className="mb-3 text-[13px] tracking-wide text-dim">&lt;/&gt; CMAS</div>
      <h1 className="text-[24px] leading-tight font-light text-ink">{title}</h1>
      {sub && <p className="mt-1.5 text-[14px] leading-relaxed text-soft">{sub}</p>}
    </div>
  )
}

/**
 * FR-08: an account from outside the faculty domain waits for an ADMIN. Shown
 * after a Google sign-in and after opening an email link, with the same words.
 * It promises no notification: the system sends no email when an ADMIN approves.
 */
export function AuthPending({ email, onOther }: { email: string; onOther: () => void }) {
  return (
    <>
      <AuthHead
        title="รอผู้ดูแลระบบอนุมัติ"
        sub="อีเมลนี้ไม่ใช่อีเมลของคณะ จึงต้องได้รับอนุมัติก่อนเข้าใช้งาน"
      />
      {email && (
        <div className="flex flex-wrap items-center gap-2 rounded-[10px] bg-wash px-3 py-2.5 text-[14px]">
          <span className="text-ink">{email}</span>
          <span className="rounded-full border border-warnBd bg-warnBg px-2 py-0.5 text-[12px] text-warn">
            รออนุมัติ
          </span>
        </div>
      )}
      <p className="text-[14px] leading-relaxed text-soft">
        ได้รับอนุมัติแล้ว กลับมาเข้าสู่ระบบอีกครั้ง
      </p>
      <button
        type="button"
        className="btn btn-primary w-full justify-center !py-2.5"
        onClick={onOther}
      >
        ใช้บัญชีอื่น (บัญชีของคณะ)
      </button>
    </>
  )
}
