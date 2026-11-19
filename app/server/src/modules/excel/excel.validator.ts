import { z } from "zod"

/** No 0/O or 1/I: a person reads this off one screen and types it into another. */
export const USER_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
export const USER_CODE_LENGTH = 8

// 32 random bytes, base64url: 43 characters. Anything else cannot be one of ours.
export const collectTokenSchema = z.object({
  deviceCode: z.string().regex(/^[A-Za-z0-9_-]{43}$/, "รหัสอุปกรณ์ไม่ถูกต้อง"),
})

// "abcd-2345", "ABCD 2345" and "ABCD2345" all mean the same code. The course
// comes from the path, never the body (A-8).
export const approveSchema = z.strictObject({
  userCode: z
    .string()
    .max(20)
    .transform((s) => s.toUpperCase().replace(/[\s-]/g, ""))
    .pipe(
      z
        .string()
        .regex(
          new RegExp(`^[${USER_CODE_ALPHABET}]{${USER_CODE_LENGTH}}$`),
          "รหัสต้องเป็นตัวอักษรและตัวเลข 8 ตัว ตามที่ Excel แสดง",
        ),
    ),
})

export const linkParamsSchema = z.object({ linkId: z.cuid() })
