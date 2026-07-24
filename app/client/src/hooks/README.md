# hooks/

The **only** place the client is allowed to talk to the API. Components call
hooks; hooks call `@/api/*`; `@/api/client.ts` attaches the JWT and surfaces
errors as toasts.

```
Component  →  hook (TanStack Query)  →  api/*.ts  →  apiClient  →  server
```

## Contract

- File name: `useClos.ts`, `useDashboard.ts`, `useAuth.ts` — `camelCase`,
  always prefixed `use`.
- Query keys are arrays, most general first: `["clos", courseId]`. Keep them
  consistent so invalidation works.
- Guard dependent queries with `enabled`.
- Mutations invalidate the queries they affect — don't refetch by hand.

## Example

```ts
export function useClos(courseId: string) {
  return useQuery({
    queryKey: ["clos", courseId],
    queryFn: () => getClosByCourse(courseId),
    enabled: Boolean(courseId),
  })
}

export function useCreateClo(courseId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createClo,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["clos", courseId] }),
  })
}
```

Target coverage: 70% (dev.md §11.1).
