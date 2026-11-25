/** The name rule of "บัญชีของฉัน", apart from the form. */

/** The server's limit (auth.validator.ts updateMeSchema). */
export const NAME_MAX = 100

/** What is wrong with a typed name, or null. */
export const nameError = (name: string) => {
  const t = name.trim()
  if (!t) return "กรอกชื่อ-สกุลก่อน"
  if (t.length > NAME_MAX) return `ชื่อยาวได้ไม่เกิน ${NAME_MAX} ตัวอักษร`
  return null
}
