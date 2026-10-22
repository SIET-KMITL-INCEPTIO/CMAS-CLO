import { toast } from "sonner"
import { NextStep } from "../../components/page/NextStep.tsx"
import { PageHeader } from "../../components/page/PageHeader.tsx"
import { useApproveUser, usePendingUsers } from "./useUsers.ts"

export default function Users() {
  const { data: pending, isLoading } = usePendingUsers()
  const approve = useApproveUser()

  return (
    <>
      <PageHeader title="จัดการผู้ใช้งาน" sub="ระดับระบบ" />
      <div className="cbody">
        <section className="card overflow-hidden">
          <div className="chart-head">
            <div>
              <div className="chart-title">รออนุมัติ</div>
              <div className="chart-sub">สมัครด้วย Google นอกโดเมนคณะ</div>
            </div>
          </div>
          {isLoading && <p className="px-4 py-6 text-[14px] text-dim">กำลังโหลด…</p>}
          {!isLoading && pending?.length === 0 && (
            <p className="px-4 py-6 text-[14px] text-dim">ไม่มีบัญชีที่รออนุมัติ</p>
          )}
          {!!pending?.length && (
            <table className="dt">
              <tbody>
                {pending.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="text-ink">{user.name}</div>
                      <div className="text-[13px] text-dim">{user.email}</div>
                    </td>
                    <td className="num">
                      <button
                        type="button"
                        className="btn btn-primary"
                        disabled={approve.isPending}
                        onClick={() =>
                          approve.mutate(user.id, {
                            onSuccess: () => toast.success(`อนุมัติ ${user.name} แล้ว`),
                          })
                        }
                      >
                        อนุมัติ
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
        <NextStep step="F7" what="ผู้ใช้ทั้งหมด · ผู้สอน · ผู้ดูแลระบบ · ระงับ · ประวัติบัญชี" />
      </div>
    </>
  )
}
