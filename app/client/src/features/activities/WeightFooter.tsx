import { Tip } from "../../components/page/PageHeader.tsx"
import { n2, near100 } from "../clos/useClos.ts"

/** Under the list: the course total against 100%, and (to those who can write) how the weights are entered. */
export function WeightFooter({
  total,
  byGroup,
  write,
  pending,
  onSwitch,
}: {
  total: number
  byGroup: boolean
  write: boolean
  /** A mode switch is being saved. */
  pending: boolean
  onSwitch: (mode: "MANUAL" | "GROUP") => void
}) {
  return (
    <div className="card mt-4 flex flex-wrap items-center justify-between gap-4 px-6 py-4">
      <span className={`text-[14px] ${near100(total) ? "text-ok" : "text-bad"}`}>
        สัดส่วนคะแนนรวม <span className="tnum">{n2(total)}%</span>
        {near100(total)
          ? " — ครบแล้ว"
          : " — ต้องเท่ากับ 100% (ยังไม่ครบบันทึกได้แต่ยังคำนวณผลไม่ได้)"}
      </span>
      {write && (
        <div className="flex flex-wrap items-center gap-1.5 text-[13px]">
          <span className="text-dim">กรอกสัดส่วนคะแนน</span>
          <button
            type="button"
            className="chipbtn"
            aria-current={byGroup ? "true" : undefined}
            disabled={pending}
            onClick={() => onSwitch("GROUP")}
          >
            ต่อกลุ่มประเภท
          </button>
          <button
            type="button"
            className="chipbtn"
            aria-current={byGroup ? undefined : "true"}
            disabled={pending}
            onClick={() => onSwitch("MANUAL")}
          >
            ทีละกิจกรรม
          </button>
          <Tip
            text={
              "ต่อกลุ่มประเภท: กรอกที่หัวกลุ่ม ระบบแบ่งให้กิจกรรมในกลุ่มตามคะแนนเต็ม\nทีละกิจกรรม: กรอกในฟอร์มของแต่ละกิจกรรม"
            }
          />
        </div>
      )}
    </div>
  )
}
