/** The keys ShortcutsModal lists — only ones the app really answers to. */
export const SHORTCUTS: [string, string][] = [
  ["Ctrl / ⌘ K", "ค้นหารายวิชาหรือหน้า"],
  ["?", "แสดงแป้นพิมพ์ลัด"],
  ["Esc", "ปิดหน้าต่างหรือยกเลิกช่องที่กำลังแก้"],
  ["Enter", "บันทึกช่องที่กำลังแก้ · ในตารางคะแนนเลื่อนลงหนึ่งแถว"],
  ["↑ ↓", "เลื่อนแถวในตารางคะแนนและรายการค้นหา"],
  ["Tab", "ไปช่องถัดไป"],
]

/** True when a key press belongs to a field the user is typing in, or a dropdown's open list. */
export const typingIn = (target: EventTarget | null) => {
  const el = target as HTMLElement | null
  return Boolean(
    el && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT", "OPTION"].includes(el.tagName)),
  )
}
