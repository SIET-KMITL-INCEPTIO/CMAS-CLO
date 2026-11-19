import { ApiError } from "./apiClient.ts"

/**
 * What to show for any failure (NFR-10, UI-7): Thai, and what to do next. The
 * server's own message wins (it says why, in the user's terms); the rest are
 * for failures that never reached it or carried no message.
 */
export function errorText(err: unknown): string {
  // ApiError always carries a Thai message: the server's own, or messageFor(status).
  if (err instanceof ApiError) return err.message
  // fetch() rejects with a TypeError when the server cannot be reached at all.
  if (err instanceof TypeError) return "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ — ตรวจอินเทอร์เน็ตแล้วลองใหม่"
  return "เกิดข้อผิดพลาด — ลองใหม่อีกครั้ง"
}
