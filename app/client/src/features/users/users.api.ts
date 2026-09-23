import { apiClient } from "../../lib/apiClient.ts"
import type { AccountStatus, User } from "../../types/user.types.ts"

export const usersApi = {
  list: (status?: AccountStatus) =>
    apiClient.get<User[]>(`/users${status ? `?status=${status}` : ""}`),
  approve: (id: string) => apiClient.patch<User>(`/users/${id}/approve`),
}
