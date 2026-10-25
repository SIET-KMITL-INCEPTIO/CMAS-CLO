/**
 * The application's Prisma client — one client, no extensions.
 *
 * There used to be two (a tenant-guarded `prisma` plus a `prisma.unscoped`
 * escape hatch) because Institution was a data boundary every query had to be
 * filtered by. The system is single-tenant as of 2026-08-04, so the only
 * boundary left is the course — and a course filter belongs in the query that
 * needs it, guarded by modules/authorization/authorization.service.ts.
 */
import { PrismaClient } from "@prisma/client"

export const prisma = new PrismaClient({
  // Prisma's default is 5 s per interactive transaction. A transaction that
  // rewrites a course's activities is one query per row, and through
  // Supabase's pooler a query costs 0.2–1 s, so the default fails with P2028
  // (seen on PUT /group-weights). 30 s is the ceiling for a write that is
  // all-or-nothing by design, not a licence for slow queries.
  transactionOptions: { maxWait: 10_000, timeout: 30_000 },
  log: [
    { emit: "event", level: "query" },
    { emit: "event", level: "warn" },
    { emit: "event", level: "error" },
  ],
})
