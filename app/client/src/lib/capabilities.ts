/**
 * Who may do what — the client copy of app/server/src/modules/authorization/
 * capabilities.ts, used ONLY to hide buttons a user cannot use (SEC-6). The
 * server checks every route itself; nothing here grants anything.
 * capabilities.test.ts fails if this table and the server's drift apart.
 */
import type { Role } from "../types/user.types.ts"

type Rule = { scope: "course" | "system"; roles: readonly Role[] }
const TEACH = ["INSTRUCTOR"] as const

export const CAPABILITIES = {
  "score.edit": { scope: "course", roles: TEACH },
  "score.import": { scope: "course", roles: TEACH },
  "score.export": { scope: "course", roles: TEACH },
  "student.write": { scope: "course", roles: TEACH },
  "activity.write": { scope: "course", roles: TEACH },
  "results.export": { scope: "course", roles: TEACH },
  "student.delete": { scope: "course", roles: TEACH },
  "activity.delete": { scope: "course", roles: TEACH },
  "clo.write": { scope: "course", roles: TEACH },
  "band.write": { scope: "course", roles: TEACH },
  "grading.run": { scope: "course", roles: TEACH },
  "grade.override": { scope: "course", roles: TEACH },
  "course.settings": { scope: "course", roles: TEACH },
  "staff.write": { scope: "course", roles: ["ADMIN", "INSTRUCTOR"] },
  "course.delete": { scope: "course", roles: ["ADMIN", "INSTRUCTOR"] },
  "course.create": { scope: "system", roles: ["ADMIN", "INSTRUCTOR"] },
  "user.manage": { scope: "system", roles: ["ADMIN"] },
  "course.view": { scope: "course", roles: ["ADMIN", "INSTRUCTOR"] },
} as const satisfies Record<string, Rule>

export type Capability = keyof typeof CAPABILITIES

/**
 * The server's rule, as a predicate: a course capability needs the caller to
 * see the course (ADMIN sees all, an instructor only the ones they teach) AND
 * hold the role. D-1: ADMIN reads every course but does no teaching work.
 */
export function allows(
  cap: Capability,
  me: { id: string; role: Role } | null,
  course?: { instructors: { userId: string }[] } | null,
): boolean {
  if (!me) return false
  const rule: Rule = CAPABILITIES[cap]
  if (!rule.roles.includes(me.role)) return false
  if (rule.scope === "system") return true
  if (!course) return false
  return me.role === "ADMIN" || course.instructors.some((i) => i.userId === me.id)
}
