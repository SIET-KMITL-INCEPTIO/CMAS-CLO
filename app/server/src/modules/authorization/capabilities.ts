/**
 * Who may do what — the server copy of `PERM` in docs/pages/index-q.html.
 *
 * capabilities.test.ts reads PERM out of the prototype and fails if the two
 * differ, so change the prototype first (it is the spec), then this table.
 *
 * `course`  — checked against one course: the caller must see the course
 *             (ADMIN sees every course, an INSTRUCTOR only the ones they are
 *             assigned to) AND hold the role.
 * `system`  — no course to check yet (creating one) or none involved (accounts).
 *
 * D-1 (2026-10-15): ADMIN is not an instructor. It opens and deletes courses,
 * assigns instructors and manages accounts, and does none of the teaching work
 * — scores, students, CLOs, activities, grading — even though it can read
 * every course.
 */
export type Role = "ADMIN" | "INSTRUCTOR"

type CapabilityRule = {
  scope: "course" | "system"
  roles: readonly Role[]
}

const TEACH = ["INSTRUCTOR"] as const

export const CAPABILITIES = {
  // ── teaching work inside a course · instructors of that course only ──
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

  // ── course administration ──
  "staff.write": { scope: "course", roles: ["ADMIN", "INSTRUCTOR"] },
  "course.delete": { scope: "course", roles: ["ADMIN", "INSTRUCTOR"] },
  "course.create": { scope: "system", roles: ["ADMIN", "INSTRUCTOR"] },
  "user.manage": { scope: "system", roles: ["ADMIN"] },

  // ── server only: not in PERM, because the prototype filters what it shows
  // instead of guarding reads (myCourses()). Every read of course data
  // declares this one.
  "course.view": { scope: "course", roles: ["ADMIN", "INSTRUCTOR"] },
} as const satisfies Record<string, CapabilityRule>

export type Capability = keyof typeof CAPABILITIES

export const isCapability = (value: string): value is Capability =>
  Object.prototype.hasOwnProperty.call(CAPABILITIES, value)
