export type Role = "ADMIN" | "INSTRUCTOR"
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
