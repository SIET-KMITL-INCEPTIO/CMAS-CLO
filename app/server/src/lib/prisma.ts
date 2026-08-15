/**
 * The application's Prisma client — one client, no extensions.
 *
 * There used to be two (a tenant-guarded `prisma` plus a `prisma.unscoped`
 * escape hatch) because Institution was a data boundary every query had to be
 * filtered by. The system is single-tenant as of 2026-08-04, so the only
 * boundary left is the course — and a course filter belongs in the query that
 * needs it, guarded by services/authorization.service.ts.
 */
import { PrismaClient } from "@prisma/client"

export const prisma = new PrismaClient()
