import type { Band, Grading, GradingBand } from "./grading.types.ts"
import { rangeText } from "./ladder.ts"

/** "ขั้นบันไดเกรด": the ladder, how many students sit on each band, and the edit / delete buttons. */
export function BandsTable({
  g,
  canWrite,
  saving,
  onNew,
  onEdit,
  onRemove,
}: {
  g: Grading
  canWrite: boolean
  /** A band delete is being saved. */
  saving: boolean
  onNew: () => void
  onEdit: (band: Band) => void
  onRemove: (band: GradingBand) => void
}) {
  const norm = g.gradeMethod === "NORM_REFERENCED"
  const pf = g.gradeScale === "PASS_FAIL"
  const maxCount = Math.max(1, ...g.bands.map((b) => b.count))
  return (
    <div className="card overflow-hidden">
      <div className="hair flex items-center justify-between px-4 py-3 text-[14px] text-ink2">
        <span>ขั้นบันไดเกรด</span>
        <span className="flex items-center gap-2">
          <span>อ่านเป็น {norm ? "T-score" : "ร้อยละ"}</span>
          {canWrite && !pf && (
            <button type="button" className="btn btn-quiet" onClick={onNew}>
              + ระดับเกรด
            </button>
          )}
        </span>
      </div>
      <div className="scroll-x">
        <table className="dt">
          <thead>
            <tr>
              <th>เกรด</th>
              <th>ช่วง ({norm ? "T-score" : "ร้อยละ"})</th>
              <th>การกระจาย</th>
              <th className="num">จำนวน</th>
              <th className="no-print" style={{ width: 130 }} />
            </tr>
          </thead>
          <tbody>
            {g.bands.map((b, i) => (
              <tr key={b.grade}>
                <td>
                  <span className="tnum text-[15px] font-medium">{b.grade}</span>
                  {b.isPassFloor && (
                    <span className="ml-1.5 text-[12.5px] text-ok">ผ่านขั้นต่ำ</span>
                  )}
                  {b.isFail && <span className="ml-1.5 text-[12.5px] text-bad">ไม่ผ่าน</span>}
                </td>
                <td className="tnum text-[14px]">{rangeText(b, i, norm)}</td>
                <td style={{ width: 220 }}>
                  <div className="h-4 overflow-hidden rounded-sm bg-wash">
                    <div
                      className="h-full bg-haze"
                      style={{ width: `${(b.count / maxCount) * 100}%` }}
                    />
                  </div>
                </td>
                <td className="num tnum">{b.count}</td>
                <td className="no-print">
                  {canWrite && (
                    <div className="flex justify-end gap-0.5">
                      <button
                        type="button"
                        className="btn btn-quiet"
                        onClick={() => onEdit({ grade: b.grade, minValue: b.minValue })}
                      >
                        แก้ไข
                      </button>
                      {b.minValue !== 0 && !pf && (
                        <button
                          type="button"
                          className="btn btn-quiet btn-danger"
                          disabled={saving}
                          onClick={() => onRemove(b)}
                        >
                          ลบ
                        </button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
