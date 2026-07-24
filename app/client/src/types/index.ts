export type Role = "ADMIN" | "INSTRUCTOR"

export type User = {
  id: string
  email: string
  name: string
  role: Role
  isActive: boolean
}

export type ApiResponse<T> = {
  success: boolean
  data?: T
  message?: string
  errors?: unknown
}
