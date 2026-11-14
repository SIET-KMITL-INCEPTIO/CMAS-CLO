import { useAuthStore } from "../features/auth/useAuthStore.ts"
import { allows, type Capability } from "../lib/capabilities.ts"

/**
 * `can("score.edit")` for the signed-in account, on `course` when the
 * capability is course-scoped. Hides buttons; the server decides (SEC-6).
 */
export function useCan(course?: { instructors: { userId: string }[] } | null) {
  const me = useAuthStore((s) => s.me)
  return (cap: Capability) => allows(cap, me, course)
}
