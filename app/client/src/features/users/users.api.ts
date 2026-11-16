import { apiClient } from "../../lib/apiClient.ts"
import type { AccountStatus, Role, User } from "../../types/user.types.ts"

/** GET /users — one row per account, every status. */
export type ListedUser = User & { authProvider: "EMAIL" | "GOOGLE"; createdAt: string }

/** GET /users/:userId — design #10: the profile, the courses it teaches and its uploads. */
export type UserDetail = User & {
  createdAt: string
  courses: { courseId: string; code: string; section: string; semester: number; year: number }[]
  uploadCount: number
}

/** GET /users/:userId/auth-events — UC 1.6, newest first. */
export type AuthEvent = {
  id: string
  action: string
  actorId: string
  actorName: string
  at: string
  detail: string | null
}

export const usersApi = {
  list: (status?: AccountStatus) =>
    apiClient.get<ListedUser[]>(`/users${status ? `?status=${status}` : ""}`),
  get: (userId: string) => apiClient.get<UserDetail>(`/users/${userId}`),
  approve: (id: string) => apiClient.patch<User>(`/users/${id}/approve`),
  update: (userId: string, body: { name?: string; role?: Role }) =>
    apiClient.patch<UserDetail>(`/users/${userId}`, body),
  setActive: (userId: string, isActive: boolean) =>
    apiClient.patch<UserDetail>(`/users/${userId}/status`, { isActive }),
  authEvents: async (userId: string, page: number) => {
    const { data, meta } = await apiClient.getWithMeta<AuthEvent[]>(
      `/users/${userId}/auth-events?page=${page}&perPage=20`,
    )
    return { events: data, total: (meta as { total: number }).total }
  },
}
