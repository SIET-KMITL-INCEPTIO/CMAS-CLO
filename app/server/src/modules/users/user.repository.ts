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

  /**
   * First sign-in by email link (FR-07): opening the link proved the mailbox.
   * The name is the part before @ until the person changes it (PATCH /auth/me).
   */
  createFromEmail(data: { email: string; role: Role; status: AccountStatus }): Promise<User> {
    return prisma.user.create({
      data: {
        email: data.email,
        name: data.email.split("@")[0]!,
        authProvider: "EMAIL",
        role: data.role,
        status: data.status,
        emailVerifiedAt: new Date(),
      },
    })
  }

  /**
   * UC 1.1: an account an ADMIN vouches for, so ACTIVE at once (no domain rule).
   * Not verified until its owner signs in with Google or an email link.
   */
  createByAdmin(data: { email: string; name: string; role: Role }): Promise<User> {
    return prisma.user.create({
      data: { ...data, authProvider: "EMAIL", status: "ACTIVE", emailVerifiedAt: null },
    })
  }

  /** Emails are stored as Google or the person typed them; a link is keyed lower-case. */
  findByEmailInsensitive(email: string): Promise<User | null> {
    return prisma.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } } })
  }

  markEmailVerified(id: string): Promise<User> {
    return prisma.user.update({ where: { id }, data: { emailVerifiedAt: new Date() } })
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

  update(id: string, data: { name?: string; role?: Role; isActive?: boolean }): Promise<User> {
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

  /** Accounts that can teach (D-1): INSTRUCTOR, approved and switched on. Three columns only (A-9). */
  searchInstructors(q: string, take: number) {
    return prisma.user.findMany({
      where: {
        role: "INSTRUCTOR",
        isActive: true,
        status: "ACTIVE",
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
        ],
      },
      orderBy: { name: "asc" },
      take,
      select: { id: true, name: true, email: true },
    })
  }
}
