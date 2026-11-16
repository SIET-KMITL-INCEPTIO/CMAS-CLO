import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { Role } from "../../types/user.types.ts"
import { usersApi } from "./users.api.ts"

export const userKeys = {
  all: ["users"] as const,
  list: () => [...userKeys.all, "list"] as const,
  one: (userId: string) => [...userKeys.all, userId] as const,
  events: (userId: string, page: number) => [...userKeys.all, userId, "events", page] as const,
}

export const useUsers = () =>
  useQuery({ queryKey: userKeys.list(), queryFn: () => usersApi.list() })

export const useUser = (userId: string | null) =>
  useQuery({
    queryKey: userKeys.one(userId ?? ""),
    queryFn: () => usersApi.get(userId!),
    enabled: userId !== null,
  })

export const useAuthEvents = (userId: string, page: number) =>
  useQuery({
    queryKey: userKeys.events(userId, page),
    queryFn: () => usersApi.authEvents(userId, page),
  })

/** Every account write changes the list, the account's detail and its history. */
function useUserWrite<A, R>(fn: (args: A) => Promise<R>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fn,
    meta: { silent: true },
    onSettled: () => void queryClient.invalidateQueries({ queryKey: userKeys.all }),
  })
}

export const useApproveUser = () => useUserWrite((id: string) => usersApi.approve(id))
export const useUpdateUser = () =>
  useUserWrite(({ id, ...body }: { id: string; name?: string; role?: Role }) =>
    usersApi.update(id, body),
  )
export const useSetUserActive = () =>
  useUserWrite(({ id, isActive }: { id: string; isActive: boolean }) =>
    usersApi.setActive(id, isActive),
  )
