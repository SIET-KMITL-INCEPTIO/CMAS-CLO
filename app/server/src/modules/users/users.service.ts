import type { AccountStatus, AuthEventAction } from "@prisma/client"
import { BusinessRuleError, NotFoundError } from "../../lib/errors.js"
import type { AuthEventRepository } from "./auth-event.repository.js"
import { UserRepository } from "./user.repository.js"
import type { UpdateUserInput } from "./users.validator.js"

const USER_NOT_FOUND = "ไม่พบผู้ใช้งานนี้"
const LAST_ADMIN = "ต้องมีผู้ดูแลระบบที่ใช้งานอยู่อย่างน้อย 1 คน"

export class UsersService {
  constructor(
    private readonly users: UserRepository,
    private readonly events?: AuthEventRepository,
  ) {}

  list(status?: AccountStatus) {
    return this.users.listByStatus(status)
  }

  /**
   * FR-08: ADMIN approves a PENDING account (out-of-domain Google sign-in).
   * Idempotent — approving an already-ACTIVE account is a no-op, not an
   * error, so a double-click or a stale admin screen can't fail loudly for
   * no reason.
   */
  async approve(id: string, actorId?: string) {
    const user = await this.users.findById(id)
    if (!user) return null
    if (user.status === "ACTIVE") return user

    const approved = await this.users.approve(id)
    if (actorId) await this.events?.record(id, actorId, "ACTIVATE", "approved")
    return approved
  }

  /** G1: the course form's instructor picker. */
  searchInstructors(q: string, limit: number) {
    return this.users.searchInstructors(q, limit)
  }

  /** Design #10. `courses` answers "can this account be removed" (FR-06). */
  async get(userId: string) {
    const user = await this.users.findProfile(userId)
    if (!user) throw new NotFoundError(USER_NOT_FOUND)
    const { courseAssignments, _count, ...rest } = user
    return {
      ...rest,
      courses: courseAssignments.map(({ course }) => ({
        courseId: course.id,
        code: course.code,
        section: course.section,
        semester: course.semester,
        year: course.year,
      })),
      uploadCount: _count.uploadLogs,
    }
  }

  /** Design #11. Every refusal is a 422 that says what to do instead. */
  async update(userId: string, input: UpdateUserInput, actorId: string) {
    const user = await this.users.findById(userId)
    if (!user) throw new NotFoundError(USER_NOT_FOUND)
    const roleChanges = input.role !== undefined && input.role !== user.role

    if (roleChanges) {
      if (userId === actorId) throw new BusinessRuleError("เปลี่ยนบทบาทของตัวเองไม่ได้")
      if (user.role === "ADMIN" && (await this.users.countOtherActiveAdmins(userId)) === 0) {
        throw new BusinessRuleError(LAST_ADMIN)
      }
      // D-1: ADMIN does no teaching work, so an account cannot be both.
      if (input.role === "ADMIN" && (await this.users.countCourses(userId)) > 0) {
        throw new BusinessRuleError(
          "ผู้ใช้นี้ยังเป็นผู้สอนในรายวิชา — เอาออกจากรายวิชาก่อนตั้งเป็นผู้ดูแลระบบ",
        )
      }
    }

    await this.users.update(userId, input)
    if (roleChanges) {
      await this.events?.record(userId, actorId, "ROLE_SET", `${user.role} -> ${input.role}`)
    }
    if (input.name !== undefined && input.name !== user.name) {
      await this.events?.record(userId, actorId, "EDIT", "name")
    }
    return this.get(userId)
  }

  /** Design #12. No DELETE /users on purpose (FR-06): an account is switched off, not removed. */
  async setActive(userId: string, isActive: boolean, actorId: string) {
    const user = await this.users.findById(userId)
    if (!user) throw new NotFoundError(USER_NOT_FOUND)
    if (!isActive) {
      if (userId === actorId) throw new BusinessRuleError("ปิดบัญชีของตัวเองไม่ได้")
      if (user.role === "ADMIN" && (await this.users.countOtherActiveAdmins(userId)) === 0) {
        throw new BusinessRuleError(LAST_ADMIN)
      }
    }
    if (user.isActive !== isActive) {
      // Takes effect on the account's next request: authMiddleware reads the live row.
      await this.users.update(userId, { isActive })
      const action: AuthEventAction = isActive ? "ACTIVATE" : "SUSPEND"
      await this.events?.record(userId, actorId, action)
    }
    return this.get(userId)
  }

  /** Design #14 — newest first, with who did it. */
  async authEvents(
    userId: string,
    query: { action?: AuthEventAction; page: number; perPage: number },
  ) {
    if (!this.events) throw new Error("UsersService was built without an AuthEventRepository")
    if (!(await this.users.findById(userId))) throw new NotFoundError(USER_NOT_FOUND)
    const { total, rows } = await this.events.list(
      userId,
      query.action,
      (query.page - 1) * query.perPage,
      query.perPage,
    )
    return {
      data: rows.map(({ actor, ...r }) => ({ ...r, actorName: actor.name })),
      meta: { total, page: query.page, perPage: query.perPage },
    }
  }
}
