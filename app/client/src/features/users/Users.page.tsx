/**
 * จัดการผู้ใช้งาน — viewUsers of index-q.html (ADMIN only, FR-05). Approve a
 * Google sign-in from outside the faculty domain, edit a name or system role,
 * switch an account off or on, and open its history.
 *
 * Not here, on purpose: "เพิ่มผู้ใช้" and "รีเซ็ตรหัสผ่าน" — accounts come from
 * Google sign-in, which has no password (D-5) — and "ลบบัญชี": an account is
 * switched off, never removed (FR-06, no DELETE /users).
 */
import { useState } from "react"
import { toast } from "sonner"
import { PageHeader, SubTabs } from "../../components/page/PageHeader.tsx"
import { Chip, Pill } from "../../components/ui/Badges.tsx"
import { useAuthStore } from "../auth/useAuthStore.ts"
import { ConfirmDelete } from "../clos/ConfirmDelete.tsx"
import { UserDrawer } from "./UserDrawer.tsx"
import { UserForm } from "./UserForm.tsx"
import type { ListedUser } from "./users.api.ts"
import { ROLE_TH } from "./userView.ts"
import { useApproveUser, useSetUserActive, useUsers } from "./useUsers.ts"

type Group = "all" | "PENDING" | "INSTRUCTOR" | "ADMIN" | "off"
const isPending = (u: ListedUser) => u.status === "PENDING"
const IN_GROUP: Record<Group, (u: ListedUser) => boolean> = {
  all: () => true,
  PENDING: isPending,
  INSTRUCTOR: (u) => u.role === "INSTRUCTOR",
  ADMIN: (u) => u.role === "ADMIN",
  off: (u) => !u.isActive,
}

export default function Users() {
  const me = useAuthStore((s) => s.me)
  const q = useUsers()
  const approve = useApproveUser()
  const setActive = useSetUserActive()
  const [group, setGroup] = useState<Group>("all")
  const [filter, setFilter] = useState("")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")
  const [detail, setDetail] = useState<string | null>(null)
  const [editing, setEditing] = useState<ListedUser | null>(null)
  const [suspending, setSuspending] = useState<ListedUser | null>(null)

  const users = q.data ?? []
  const count = (g: Group) => users.filter(IN_GROUP[g]).length
  const tabs = [
    { id: "all" as const, label: `ทั้งหมด ${users.length}` },
    ...(count("PENDING")
      ? [{ id: "PENDING" as const, label: `รออนุมัติ ${count("PENDING")}` }]
      : []),
    { id: "INSTRUCTOR" as const, label: `ผู้สอน ${count("INSTRUCTOR")}` },
    { id: "ADMIN" as const, label: `ผู้ดูแลระบบ ${count("ADMIN")}` },
    { id: "off" as const, label: `ระงับ ${count("off")}` },
  ]
  const shownGroup = group === "PENDING" && !count("PENDING") ? "all" : group
  const needle = filter.trim().toLowerCase()
  const list = users
    .filter(IN_GROUP[shownGroup])
    .filter(
      (u) => !needle || `${u.name} ${u.email} ${ROLE_TH[u.role]}`.toLowerCase().includes(needle),
    )
    .sort((a, b) => (sortDir === "asc" ? 1 : -1) * a.name.localeCompare(b.name, "th"))

  const toggle = (u: ListedUser, isActive: boolean) =>
    setActive.mutate(
      { id: u.id, isActive },
      {
        onSuccess: () => {
          toast.success(isActive ? `เปิดใช้งาน ${u.name} แล้ว` : `ระงับการใช้งาน ${u.name} แล้ว`)
          setSuspending(null)
        },
        onError: (e) => toast.error(e.message),
      },
    )

  return (
    <>
      <PageHeader
        title="จัดการผู้ใช้งาน"
        sub="ระดับระบบ"
        tools={
          <input
            className="inp !w-64"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="ค้นหาชื่อหรืออีเมล"
            aria-label="ค้นหาผู้ใช้"
          />
        }
        help={
          <>
            กดชื่อผู้ใช้เพื่อตรวจสอบว่าบัญชีนั้นผูกกับรายวิชาใด อัปโหลดอะไรไว้
            และเกิดอะไรขึ้นกับบัญชีบ้าง · บัญชีเข้าสู่ระบบด้วย Google จึงไม่มีรหัสผ่านให้รีเซ็ต ·
            บัญชีลบไม่ได้ ใช้ “ระงับการใช้งาน” แทน ·
            ผู้ดูแลที่ใช้งานอยู่คนสุดท้ายจะถูกระงับหรือลดบทบาทไม่ได้ · สมัครด้วย Google
            นอกโดเมนคณะต้องได้รับการอนุมัติก่อน
          </>
        }
      />
      <div className="-mt-px">
        <SubTabs tabs={tabs} value={shownGroup} onChange={setGroup} />
      </div>
      <div className="cbody">
        <div className="card scroll-x overflow-hidden">
          {q.isLoading ? (
            <p className="px-4 py-6 text-[14px] text-dim">กำลังโหลด…</p>
          ) : list.length === 0 ? (
            <p className="px-4 py-10 text-center text-[14px] text-dim">
              {needle ? "ไม่พบผู้ใช้ที่ตรงกับคำค้น" : "ไม่มีผู้ใช้ในกลุ่มนี้"}
            </p>
          ) : (
            <table className="dt">
              <thead>
                <tr>
                  <th>
                    <button
                      type="button"
                      className="hover:text-ink"
                      onClick={() => setSortDir(sortDir === "asc" ? "desc" : "asc")}
                      aria-label="เรียงตามชื่อ"
                    >
                      ผู้ใช้ {sortDir === "asc" ? "▲" : "▼"}
                    </button>
                  </th>
                  <th>บทบาทระบบ</th>
                  <th>สถานะ</th>
                  <th className="no-print" />
                </tr>
              </thead>
              <tbody>
                {list.map((u) => {
                  const self = u.id === me?.id
                  return (
                    <tr key={u.id}>
                      <td>
                        <button
                          type="button"
                          className="text-left transition-opacity hover:opacity-75"
                          onClick={() => setDetail(u.id)}
                        >
                          <div className="text-[14px] text-ink underline decoration-transparent underline-offset-2 hover:decoration-inherit">
                            {u.name}
                            {self && <span className="text-dim"> (คุณ)</span>}
                          </div>
                          <div className="tnum text-[13px] text-dim">{u.email}</div>
                        </button>
                      </td>
                      <td>
                        <Pill>{ROLE_TH[u.role]}</Pill>
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          {isPending(u) && u.isActive ? (
                            <Chip tone="warn">รออนุมัติ</Chip>
                          ) : (
                            <Chip tone={u.isActive ? "ok" : "nil"}>
                              {u.isActive ? "ใช้งานอยู่" : "ระงับการใช้งาน"}
                            </Chip>
                          )}
                          {u.authProvider === "GOOGLE" && <Pill>Google</Pill>}
                        </div>
                      </td>
                      <td className="no-print">
                        <div className="flex flex-wrap justify-end gap-1">
                          {isPending(u) && u.isActive && (
                            <button
                              type="button"
                              className="btn btn-primary"
                              disabled={approve.isPending}
                              onClick={() =>
                                approve.mutate(u.id, {
                                  onSuccess: () => toast.success(`อนุมัติ ${u.name} แล้ว`),
                                  onError: (e) => toast.error(e.message),
                                })
                              }
                            >
                              อนุมัติ
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn btn-quiet"
                            onClick={() => setDetail(u.id)}
                          >
                            ตรวจสอบ
                          </button>
                          {!isPending(u) && (
                            <button
                              type="button"
                              className="btn btn-quiet"
                              onClick={() => setEditing(u)}
                            >
                              แก้ไข
                            </button>
                          )}
                          {!self &&
                            (u.isActive ? (
                              <button
                                type="button"
                                className="btn btn-quiet"
                                onClick={() => setSuspending(u)}
                              >
                                ระงับการใช้งาน
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="btn btn-quiet"
                                disabled={setActive.isPending}
                                onClick={() => toggle(u, true)}
                              >
                                เปิดใช้งาน
                              </button>
                            ))}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <UserDrawer userId={detail} onClose={() => setDetail(null)} />
      {editing && (
        <UserForm user={editing} self={editing.id === me?.id} onClose={() => setEditing(null)} />
      )}
      {suspending && (
        <ConfirmDelete
          title={`ระงับการใช้งาน ${suspending.name}`}
          rows={[]}
          warning="บัญชีนี้จะเข้าสู่ระบบไม่ได้ตั้งแต่คำขอถัดไป"
          note="ข้อมูล รายวิชาที่ดูแล และประวัติยังอยู่ครบ · เปิดใช้งานคืนได้ทุกเมื่อ"
          label="ระงับการใช้งาน"
          pending={setActive.isPending}
          onConfirm={() => toggle(suspending, false)}
          onClose={() => setSuspending(null)}
        />
      )}
    </>
  )
}
