/**
 * ตรวจสอบบัญชี (UC 1.6) — the prototype's `user-detail` drawer: which courses
 * the account teaches, how many score files it uploaded, and its history
 * (sign-ins, role and status changes, refused actions), newest first.
 */
import { useState } from "react"
import { Link } from "react-router-dom"
import { Drawer } from "../../components/overlay/Sheet.tsx"
import { Chip, Pill } from "../../components/ui/Badges.tsx"
import { ROLE_TH } from "./userView.ts"
import { useAuthEvents, useUser } from "./useUsers.ts"

const ACTION_TH: Record<string, string> = {
  CREATE: "สร้างบัญชี",
  EDIT: "แก้ไขข้อมูล",
  ROLE_SET: "เปลี่ยนบทบาท",
  SUSPEND: "ระงับการใช้งาน",
  ACTIVATE: "เปิดใช้งาน / อนุมัติ",
  PW_RESET: "รีเซ็ตรหัสผ่าน",
  PW_CHANGE: "เปลี่ยนรหัสผ่าน",
  DENY: "ถูกปฏิเสธสิทธิ์",
  REGISTER: "สมัครใช้งาน",
  VERIFY: "ยืนยันอีเมล",
  LOGIN: "เข้าสู่ระบบ",
  LOGIN_GOOGLE: "เข้าสู่ระบบด้วย Google",
  LOGOUT: "ออกจากระบบ",
}
const PER_PAGE = 20
const when = (iso: string) => iso.slice(0, 16).replace("T", " ")

function History({ userId }: { userId: string }) {
  const [page, setPage] = useState(1)
  const q = useAuthEvents(userId, page)
  const total = q.data?.total ?? 0
  const pages = Math.max(1, Math.ceil(total / PER_PAGE))
  if (q.isLoading) return <div className="text-[14px] text-dim">กำลังโหลด…</div>
  if (!q.data?.events.length) return <div className="text-[14px] text-dim">ยังไม่มีประวัติ</div>
  return (
    <>
      <ul className="divide-y divide-edge">
        {q.data.events.map((e) => (
          <li key={e.id} className="py-2.5 text-[14px]">
            <div className={e.action === "DENY" ? "text-bad" : "text-ink"}>
              {ACTION_TH[e.action] ?? e.action}
              {e.detail && <span className="text-dim"> · {e.detail}</span>}
            </div>
            <div className="text-[12.5px] text-dim">
              <span className="tnum">{when(e.at)}</span>
              {e.actorId !== userId && ` · โดย ${e.actorName}`}
            </div>
          </li>
        ))}
      </ul>
      {pages > 1 && (
        <div className="mt-3 flex items-center justify-between text-[13px] text-dim">
          <button
            type="button"
            className="btn btn-quiet"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            ‹ ใหม่กว่า
          </button>
          <span className="tnum">
            {page} / {pages}
          </span>
          <button
            type="button"
            className="btn btn-quiet"
            disabled={page >= pages}
            onClick={() => setPage(page + 1)}
          >
            เก่ากว่า ›
          </button>
        </div>
      )}
    </>
  )
}

export function UserDrawer({ userId, onClose }: { userId: string | null; onClose: () => void }) {
  const q = useUser(userId)
  const u = q.data
  return (
    <Drawer
      open={userId !== null}
      onClose={onClose}
      title={u?.name ?? "บัญชีผู้ใช้"}
      sub={u?.email}
    >
      {q.isLoading || !u ? (
        <div className="text-[14px] text-dim">กำลังโหลด…</div>
      ) : (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <Pill>{ROLE_TH[u.role]}</Pill>
            {u.status === "PENDING" ? (
              <Chip tone="warn">รออนุมัติ</Chip>
            ) : (
              <Chip tone={u.isActive ? "ok" : "nil"}>
                {u.isActive ? "ใช้งานอยู่" : "ระงับการใช้งาน"}
              </Chip>
            )}
            <span className="tnum text-[13px] text-dim">สร้างเมื่อ {when(u.createdAt)}</span>
          </div>

          <section>
            <div className="over mb-2">รายวิชาที่ดูแล ({u.courses.length})</div>
            {u.courses.length === 0 ? (
              <div className="text-[14px] text-dim">ไม่ได้เป็นผู้สอนในรายวิชาใด</div>
            ) : (
              <ul className="space-y-1.5">
                {u.courses.map((c) => (
                  <li key={c.courseId} className="text-[14px]">
                    <Link
                      to={`/courses/${c.courseId}`}
                      className="underline decoration-transparent underline-offset-2 hover:decoration-inherit"
                      onClick={onClose}
                    >
                      <span className="tnum">{c.code}</span> · Sec {c.section} · ภาค {c.semester}/
                      {c.year}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-2 text-[13px] text-dim">
              อัปโหลดไฟล์คะแนน <span className="tnum">{u.uploadCount}</span> ครั้ง
            </div>
          </section>

          <section>
            <div className="over mb-2">ประวัติการใช้งาน</div>
            <History userId={u.id} />
          </section>
        </div>
      )}
    </Drawer>
  )
}
