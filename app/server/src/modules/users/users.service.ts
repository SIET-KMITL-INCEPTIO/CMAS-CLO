import type { AccountStatus } from "@prisma/client"
import { UserRepository } from "./user.repository.js"

export class UsersService {
  constructor(private readonly users: UserRepository) {}

  list(status?: AccountStatus) {
    return this.users.listByStatus(status)
  }

  /**
   * FR-08: ADMIN approves a PENDING account (out-of-domain Google sign-in).
   * Idempotent — approving an already-ACTIVE account is a no-op, not an
   * error, so a double-click or a stale admin screen can't fail loudly for
   * no reason.
   */
  async approve(id: string) {
    const user = await this.users.findById(id)
    if (!user) return null
    if (user.status === "ACTIVE") return user

    return this.users.approve(id)
  }
}
