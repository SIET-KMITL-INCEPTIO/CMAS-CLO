/**
 * ประวัติการแก้คะแนน: one row per change of one cell — who, when, from what to
 * what, and where it came from (typed, pasted, imported, filled, closing). The
 * list only grows; nothing here edits a score (A-12).
 */
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { Drawer } from "../../components/overlay/Sheet.tsx"
import { courseKeys } from "../courses/useCourses.ts"
import { scoresApi } from "./scores.api.ts"

const SOURCE_TH: Record<string, string> = {
  MANUAL: "พิมพ์เอง",
  PASTE: "วางจาก Excel",
  IMPORT: "นำเข้าไฟล์",
  FILL: "เติมคะแนนเต็ม",
  FILL_UNDO: "เลิกทำการเติม",
  UNDO: "เลิกทำ",
  CLOSE: "ตอนปิดรับคะแนน",
}
const show = (v: number | "EXCUSED" | null) =>
  v === null ? "ว่าง" : v === "EXCUSED" ? "ยกเว้น" : String(v)

export function ChangesDrawer({ courseId, onClose }: { courseId: string; onClose: () => void }) {
  const [page, setPage] = useState(1)
  const list = useQuery({
    queryKey: [...courseKeys.one(courseId), "score-changes", page],
    queryFn: () => scoresApi.changes(courseId, page),
  })
  const total = list.data?.total ?? 0
  const pages = Math.max(1, Math.ceil(total / 30))
  return (
    <Drawer
      open
      onClose={onClose}
      title="ประวัติการแก้คะแนน"
      sub={total ? `${total} รายการ · ล่าสุดก่อน` : undefined}
    >
      {list.isLoading ? (
        <div className="text-[14px] text-dim">กำลังโหลด…</div>
      ) : (list.data?.changes.length ?? 0) === 0 ? (
        <div className="text-[14px] text-dim">ยังไม่มีการแก้คะแนน</div>
      ) : (
        <ul className="divide-y divide-edge">
          {list.data!.changes.map((c) => (
            <li key={c.id} className="py-2.5 text-[14px]">
              <div>
                <span className="tnum text-dim">{c.studentCode}</span> · {c.activityName}
              </div>
              <div>
                <span className="tnum">{show(c.from)}</span> →{" "}
                <span className="tnum text-ink">{show(c.to)}</span>
              </div>
              <div className="text-[12.5px] text-dim">
                {SOURCE_TH[c.source] ?? c.source} · {c.changedBy?.name ?? "—"} ·{" "}
                <span className="tnum">{c.changedAt.slice(0, 16).replace("T", " ")}</span>
                {c.note ? ` · ${c.note}` : ""}
              </div>
            </li>
          ))}
        </ul>
      )}
      {pages > 1 && (
        <div className="mt-3 flex items-center gap-2 text-[14px]">
          <button
            type="button"
            className="btn"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            ‹
          </button>
          <span className="tnum">
            {page} / {pages}
          </span>
          <button
            type="button"
            className="btn"
            disabled={page >= pages}
            onClick={() => setPage(page + 1)}
          >
            ›
          </button>
        </div>
      )}
    </Drawer>
  )
}
