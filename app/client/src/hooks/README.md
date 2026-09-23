# hooks/

**Shared hooks only.** A data hook for one feature lives with it
(`features/clo/useClos.ts`) and moves here only when a second feature needs it.
See [features/README.md](../features/README.md).

Hooks are the **only** code allowed to talk to the API. Components call hooks,
hooks call a feature's `xxx.api.ts`, and that calls `@/lib/apiClient.ts`, which
attaches the JWT and shows errors as toasts.

```
Component  →  useXxx.ts (TanStack Query)  →  xxx.api.ts  →  lib/apiClient.ts  →  server
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
