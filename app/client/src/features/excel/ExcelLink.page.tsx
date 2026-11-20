/**
 * เชื่อมต่อ Excel (FR-73, FR-74): the instructor types the code the CMAS
 * add-in for Excel shows and picks ONE course. The add-in then reads that
 * course and writes its scores for 8 hours, and nothing else. Live
 * connections are listed below, each can be cut at once.
 *
 * The add-in lands people here from its own dialog (verifyUrl /excel/link),
 * so the page is the code box first and everything else after.
 */
import { useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { toast } from "sonner"
import { PageHeader } from "../../components/page/PageHeader.tsx"
import { PageState } from "../../components/page/PageState.tsx"
import { Field } from "../../components/ui/Badges.tsx"
import { useAuthStore } from "../auth/useAuthStore.ts"
import { byTerm, useCourseList } from "../courses/useCourses.ts"
import { excelApi } from "./excel.api.ts"
import {
  formatUserCode,
  useAddinRelease,
  useApproveExcel,
  useExcelLinks,
  useRevokeExcel,
} from "./useExcel.ts"

const when = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" })
    : "ยังไม่ได้ใช้"

/** Step 0: get the add-in. Not code-signed, so the SHA-256 is shown next to the download (FR-75). */
function AddinDownload() {
  const release = useAddinRelease()
  const [busy, setBusy] = useState(false)
  const r = release.data
  const download = async () => {
    setBusy(true)
    try {
      await excelApi.downloadAddin()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "ดาวน์โหลดไม่สำเร็จ")
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="card grid max-w-xl gap-3 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-semibold">ติดตั้ง add-in CMAS</h2>
          <p className="text-[13px] text-dim">
            Excel บนคอมพิวเตอร์ (Windows / Mac) · ไม่รองรับ Excel บนเว็บ
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary shrink-0"
          disabled={!r?.sha256 || busy}
          onClick={() => void download()}
        >
          {busy ? "กำลังดาวน์โหลด…" : `ดาวน์โหลด v${r?.version ?? ""}`}
        </button>
      </div>
      {r && !r.sha256 && (
        <p className="text-[13px] text-dim">ยังไม่เปิดให้ดาวน์โหลด — รอผู้ดูแลเผยแพร่ไฟล์</p>
      )}
      {r?.sha256 && (
        <>
          <p className="break-all font-mono text-[12px] text-dim">SHA-256 {r.sha256}</p>
          <ol className="list-decimal space-y-1 pl-5 text-[13px]">
            <li>
              ตรวจไฟล์ก่อนติดตั้ง: <code>Get-FileHash CMAS.xlam</code> (Windows) หรือ{" "}
              <code>shasum -a 256 CMAS.xlam</code> (Mac) ต้องได้ค่าเท่ากับด้านบน
            </li>
            <li>Windows: คลิกขวาที่ไฟล์ → Properties → ติ๊ก Unblock → OK</li>
            <li>
              Excel → File → Options → Add-ins → Manage: Excel Add-ins → Go → Browse… เลือกไฟล์ →
              ติ๊ก CMAS
            </li>
            <li>แท็บ CMAS → เชื่อมต่อ แล้วกรอกรหัสที่ได้ด้านล่าง</li>
          </ol>
        </>
      )}
    </div>
  )
}

export default function ExcelLink() {
  const me = useAuthStore((s) => s.me)
  const courses = useCourseList()
  const links = useExcelLinks()
  const approve = useApproveExcel()
  const revoke = useRevokeExcel()

  const [code, setCode] = useState("")
  // ?course= comes from the Excel dialog on a course's roster page.
  const [params] = useSearchParams()
  const [courseId, setCourseId] = useState(params.get("course") ?? "")
  const [error, setError] = useState<string | null>(null)

  // Only courses the caller teaches: the server checks score.edit anyway (ADMIN does no teaching, D-1).
  const teaching = useMemo(
    () =>
      [...(courses.data?.courses ?? [])]
        .filter((c) => c.instructors.some((i) => i.userId === me?.id))
        .sort(byTerm),
    [courses.data, me?.id],
  )
  // A ?course= the caller doesn't teach falls back to the first one they do.
  const chosen = teaching.some((c) => c.id === courseId) ? courseId : teaching[0]?.id || ""

  const submit = () => {
    const userCode = code.replace("-", "")
    if (userCode.length !== 8) return setError("กรอกรหัส 8 ตัวตามที่ Excel แสดง")
    if (!chosen) return setError("เลือกรายวิชา")
    approve.mutate(
      { userCode, courseId: chosen },
      {
        onSuccess: () => {
          toast.success("เชื่อมต่อแล้ว — กลับไปที่ Excel ได้เลย")
          setCode("")
          setError(null)
        },
        onError: (e) => setError(e.message),
      },
    )
  }

  return (
    <>
      <PageHeader
        title="เชื่อมต่อ Excel"
        sub="กรอกรหัสจาก add-in CMAS ใน Excel"
        help={
          <>
            Excel จะแก้คะแนนของรายวิชาที่เลือกได้ 1 วิชา นาน 8 ชั่วโมง · ไม่มีรหัสผ่านอยู่ในไฟล์ ·
            ตัดการเชื่อมต่อได้ทุกเมื่อด้านล่าง · CMAS ไม่ส่ง add-in ทางอีเมล ไฟล์ .xlsm หรือ .xlam
            ที่แนบมาในอีเมลไม่ใช่ของ CMAS
          </>
        }
      />
      {/* space-y, not grid: .cbody has a fixed height, and a grid shrinks an overflow-hidden card to 0 */}
      <div className="cbody space-y-4">
        <AddinDownload />
        <PageState
          loading={courses.isLoading}
          error={courses.error}
          onRetry={() => void courses.refetch()}
          what="รายวิชา"
        >
          <div className="card grid max-w-xl gap-4 p-4">
            {teaching.length === 0 ? (
              <p className="text-[14px] text-dim">คุณยังไม่ได้เป็นผู้สอนของรายวิชาใด</p>
            ) : (
              <form
                className="grid gap-4"
                noValidate
                onSubmit={(e) => {
                  e.preventDefault()
                  submit()
                }}
              >
                <Field label="รหัสจาก Excel" htmlFor="xl-code" required error={error}>
                  <input
                    id="xl-code"
                    className="inp font-mono text-[20px] tracking-[0.2em] uppercase"
                    autoComplete="off"
                    autoFocus
                    inputMode="text"
                    placeholder="ABCD-2345"
                    value={code}
                    onChange={(e) => {
                      setCode(formatUserCode(e.target.value))
                      setError(null)
                    }}
                    aria-invalid={error ? true : undefined}
                  />
                </Field>
                <Field label="รายวิชา" htmlFor="xl-course" required>
                  <select
                    id="xl-course"
                    className="inp"
                    value={chosen}
                    onChange={(e) => setCourseId(e.target.value)}
                  >
                    {teaching.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code} {c.name} · Sec {c.section} · {c.semester}/{c.year}
                      </option>
                    ))}
                  </select>
                </Field>
                <div>
                  <button type="submit" className="btn btn-primary" disabled={approve.isPending}>
                    {approve.isPending ? "กำลังเชื่อมต่อ…" : "เชื่อมต่อ"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </PageState>

        <div className="card scroll-x overflow-hidden">
          {links.isLoading ? (
            <p className="px-4 py-6 text-[14px] text-dim">กำลังโหลด…</p>
          ) : (links.data ?? []).length === 0 ? (
            <p className="px-4 py-6 text-[14px] text-dim">ไม่มี Excel ที่เชื่อมต่ออยู่</p>
          ) : (
            <table className="dt">
              <thead>
                <tr>
                  <th>รายวิชา</th>
                  <th>ใช้ล่าสุด</th>
                  <th>หมดอายุ</th>
                  <th className="no-print" />
                </tr>
              </thead>
              <tbody>
                {links.data!.map((l) => (
                  <tr key={l.id}>
                    <td>
                      {l.course.code} {l.course.name} · Sec {l.course.section}
                    </td>
                    <td>{when(l.lastUsedAt)}</td>
                    <td>{when(l.expiresAt)}</td>
                    <td className="no-print text-right">
                      <button
                        type="button"
                        className="btn"
                        disabled={revoke.isPending}
                        onClick={() =>
                          revoke.mutate(l.id, {
                            onSuccess: () => toast.success("ตัดการเชื่อมต่อแล้ว"),
                            onError: (e) => toast.error(e.message),
                          })
                        }
                      >
                        ตัดการเชื่อมต่อ
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  )
}
