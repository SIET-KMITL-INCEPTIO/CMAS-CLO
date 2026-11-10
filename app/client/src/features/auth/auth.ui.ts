// Class strings and copy shared by the sign-in screens (Login, Verify).
// One rule for both ways in (Google, e-mail link): faculty domain → ACTIVE at once,
// any other address → PENDING until an ADMIN approves (FR-08).

export const authInput =
  "w-full rounded-[10px] border border-edge bg-card px-3 py-2 text-sm text-ink placeholder:text-faint " +
  "focus-visible:border-haze focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-haze " +
  "aria-invalid:border-bad aria-invalid:bg-bad-bg"

export const authSecondary =
  "w-full rounded-[10px] border border-edge bg-card px-3 py-2.5 text-sm text-ink " +
  "hover:bg-wash disabled:opacity-60 " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-haze"

export const authPrimary =
  "w-full rounded-[10px] border border-mid bg-mid px-3 py-2.5 text-sm text-white " +
  "hover:border-haze hover:bg-haze disabled:opacity-50 " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-haze"

export const PENDING_TITLE = "รอผู้ดูแลระบบอนุมัติ"
export const PENDING_SUBTITLE = "อีเมลนี้ไม่ใช่อีเมลของคณะ จึงต้องได้รับอนุมัติก่อนเข้าใช้งาน"
