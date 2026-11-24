import type { CourseWithReadiness } from "./course.types.ts"
import { CourseCard } from "./CourseCard.tsx"
import { bucketNote, COURSE_TABLE_HEADS, type CourseActions } from "./courseListParts.tsx"
import { CourseTableRow } from "./CourseTableRow.tsx"
import type { Bucket, GroupBy } from "./courseView.ts"
import type { View } from "./coursePrefs.ts"

/** The list itself: cards or a table, flat or in groups, or a note when the filter matches nothing. */
export function CourseListBody({
  shown,
  buckets,
  view,
  group,
  filter,
  act,
}: {
  shown: CourseWithReadiness[]
  buckets: Bucket<CourseWithReadiness>[]
  view: View
  group: GroupBy
  filter: string
  act: CourseActions
}) {
  const none = group === "none"
  const cards = (items: CourseWithReadiness[]) => (
    <div className="cgrid">
      {items.map((c) => (
        <CourseCard key={c.id} c={c} act={act} />
      ))}
    </div>
  )
  return (
    <>
      {shown.length === 0 ? (
        <div className="text-[14px] text-dim">ไม่พบรายวิชาที่ตรงกับ “{filter}”</div>
      ) : view === "card" ? (
        none ? (
          cards(shown)
        ) : (
          buckets.map((b) => (
            <section key={b.key}>
              <div className="cgrouptitle">
                <span className="text-[16px] text-ink">{b.head}</span>
                <span className="text-[13px] text-dim">{bucketNote(b)}</span>
              </div>
              {cards(b.items)}
            </section>
          ))
        )
      ) : (
        <div className="card overflow-x-auto">
          <table className="dt">
            <thead>
              <tr>
                {COURSE_TABLE_HEADS.map((h, i) => (
                  <th key={i} className={h === "นศ." ? "num" : undefined}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {none
                ? shown.map((c) => <CourseTableRow key={c.id} c={c} act={act} />)
                : buckets.flatMap((b) => [
                    <tr key={`h-${b.key}`} className="cgrouphead">
                      <td colSpan={COURSE_TABLE_HEADS.length}>
                        <span className="text-[14px] text-ink">{b.head}</span>
                        <span className="text-[13px] text-dim"> · {bucketNote(b)}</span>
                      </td>
                    </tr>,
                    ...b.items.map((c) => <CourseTableRow key={c.id} c={c} act={act} />),
                  ])}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
