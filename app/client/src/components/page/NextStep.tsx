/**
 * Placeholder body for a page whose screen arrives in a later step of
 * docs/markdown/dev/planning/frontend-plan.md §5. Says which step, and that
 * the data behind it already works through the API — nothing more.
 */
export function NextStep({ step, what }: { step: string; what: string }) {
  return (
    <div className="card mx-auto mt-6 max-w-lg p-6 text-center">
      <div className="over">ขั้น {step}</div>
      <div className="mt-2 text-[16px] text-ink">{what}</div>
      <p className="mt-1 text-[14px] text-soft">
        หน้าจอนี้ทำในขั้นถัดไป · API ของหน้านี้พร้อมใช้แล้ว
      </p>
    </div>
  )
}
