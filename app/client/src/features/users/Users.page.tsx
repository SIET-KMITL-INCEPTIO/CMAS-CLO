import { toast } from "sonner"
import { useApproveUser, usePendingUsers } from "./useUsers.ts"

export default function Users() {
  const { data: pending, isLoading } = usePendingUsers()
  const approve = useApproveUser()

  return (
    <div className="p-6">
      <h1 className="text-xl font-medium">จัดการผู้ใช้งาน</h1>

      <section className="mt-6">
        <h2 className="mb-2 text-sm font-medium text-gray-600">
          รออนุมัติ (สมัครด้วย Google นอกโดเมนคณะ)
        </h2>

        {isLoading && <p className="text-sm text-gray-500">กำลังโหลด...</p>}
        {!isLoading && pending?.length === 0 && (
          <p className="text-sm text-gray-500">ไม่มีบัญชีที่รออนุมัติ</p>
        )}

        <ul className="divide-y rounded-lg border">
          {pending?.map((user) => (
            <li key={user.id} className="flex items-center justify-between p-3">
              <div>
                <p className="font-medium">{user.name}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
              <button
                type="button"
                className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
                disabled={approve.isPending}
                onClick={() =>
                  approve.mutate(user.id, {
                    onSuccess: () => toast.success(`อนุมัติ ${user.name} แล้ว`),
                  })
                }
              >
                อนุมัติ
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* TODO: 5.1.1 — full user list, toggle role/active via useQuery + apiClient */}
    </div>
  )
}
