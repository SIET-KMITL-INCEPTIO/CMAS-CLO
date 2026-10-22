/**
 * The only file that touches `prisma.user`. Shared by modules/users (account
 * management) and modules/auth (login/registration needs the same rows) —
 * the User model has one owner, this module, rather than two repositories
 * drifting apart on the same table.
 */
import type { AccountStatus, Role, User } from "@prisma/client"
import { prisma } from "../../db/prisma.js"

export class UserRepository {
  findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } })
  }

  findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } })
  }

  findByGoogleSub(googleSub: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { googleSub } })
  }

  /**
   * First-ever Google sign-in for this email (FR-08). The service decides the
   * role: INSTRUCTOR, or ADMIN only for an address in ADMIN_EMAILS (FR-05a).
   * Self-registration never grants ADMIN on its own.
   */
  createFromGoogle(data: {
    email: string
    name: string
    googleSub: string
    role: Role
    status: AccountStatus
  }): Promise<User> {
    return prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        googleSub: data.googleSub,
        authProvider: "GOOGLE",
        role: data.role,
        status: data.status,
        emailVerifiedAt: new Date(), // Google already verified it (email_verified)
      },
    })
  }

  /** An existing EMAIL account signing in with Google for the first time. */
  linkGoogleSub(userId: string, googleSub: string): Promise<User> {
    return prisma.user.update({ where: { id: userId }, data: { googleSub } })
  }

  listByStatus(status?: AccountStatus) {
    return prisma.user.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        status: true,
        authProvider: true,
        createdAt: true,
      },
    })
  }

  approve(id: string): Promise<User> {
    return prisma.user.update({ where: { id }, data: { status: "ACTIVE" } })
  }

  /** FR-05a: an existing account whose email is in ADMIN_EMAILS. */
  grantAdmin(id: string): Promise<User> {
    return prisma.user.update({ where: { id }, data: { role: "ADMIN", status: "ACTIVE" } })
  }

  /** GET /auth/me and GET /users/:userId (A-9: never passwordHash or googleSub). */
  findProfile(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        isActive: true,
        authProvider: true,
        createdAt: true,
        courseAssignments: {
          orderBy: { assignedAt: "asc" },
          select: {
            course: {
              select: { id: true, code: true, section: true, semester: true, year: true },
            },
          },
        },
        _count: { select: { uploadLogs: true } },
      },
    })
  }

  update(id: string, data: { name?: string; role?: Role; isActive?: boolean }) {
    return prisma.user.update({ where: { id }, data })
  }

  /** Active ADMIN accounts other than `exceptId` — the last one must stay (design #11, #12). */
  countOtherActiveAdmins(exceptId: string) {
    return prisma.user.count({
      where: { role: "ADMIN", isActive: true, status: "ACTIVE", id: { not: exceptId } },
    })
  }

  countCourses(id: string) {
    return prisma.courseInstructor.count({ where: { userId: id } })
  }
}
