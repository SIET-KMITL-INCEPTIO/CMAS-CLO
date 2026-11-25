export type Role = "ADMIN" | "INSTRUCTOR"

/** The role as the screens say it: the account menu, "บัญชีของฉัน" and the users page. */
export const ROLE_TH: Record<Role, string> = { ADMIN: "ผู้ดูแลระบบ", INSTRUCTOR: "ผู้สอน" }
export type AccountStatus = "PENDING" | "ACTIVE"

export type User = {
  id: string
  email: string
  name: string
  role: Role
  isActive: boolean
  status: AccountStatus
}

/** GET /auth/me — the live row, read on every sign-in and reload (NFR-19). */
export type Me = {
  id: string
  email: string
  name: string
  role: Role
  status: AccountStatus
  courseCount: number
}
