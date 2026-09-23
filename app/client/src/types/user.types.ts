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
