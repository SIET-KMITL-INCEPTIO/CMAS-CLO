import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { usersApi } from "./users.api.ts"

export function usePendingUsers() {
  return useQuery({
    queryKey: ["users", "PENDING"],
    queryFn: () => usersApi.list("PENDING"),
  })
}

export function useApproveUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => usersApi.approve(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  })
}
