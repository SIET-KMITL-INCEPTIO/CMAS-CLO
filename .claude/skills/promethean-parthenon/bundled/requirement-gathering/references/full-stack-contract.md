# Full-Stack Contract Reference — PERN / MERN

## REST API Contract Pattern

Use this template for every Express endpoint affecting a React component:

```
ENDPOINT: POST /api/auth/login
Auth:      public
Rate limit: 10/min per IP
Request body:
  { email: string (required), password: string (required) }
Response 200:
  { token: string, user: { id, email, role } }
Response 400: { error: "Validation failed", fields: string[] }
Response 401: { error: "Invalid credentials" }
Response 429: { error: "Too many attempts" }
Side effects:
  - Creates session in DB / issues JWT
  - Logs login attempt
```

---

## PERN-Specific (PostgreSQL)

### Schema Change Checklist
When a feature requires new DB fields:
```
[ ] Migration file created (knex/prisma/sql)
[ ] Rollback migration defined
[ ] Indexes added for queried fields
[ ] NOT NULL with default OR nullable with reason documented
[ ] Enum types defined if applicable
[ ] Foreign keys with ON DELETE behavior specified
```

### Query Performance Rules
- Every `WHERE` clause field must have an index
- No `SELECT *` in production code — list fields explicitly
- Pagination required for any list endpoint (limit/offset or cursor)
- N+1 queries forbidden — use JOIN or eager loading

---

## MERN-Specific (MongoDB)

### Schema Change Checklist
```
[ ] Mongoose schema updated with validation
[ ] Indexes defined in schema (compound if needed)
[ ] virtuals documented if used
[ ] Embedded vs referenced decision documented
[ ] Atlas Search index updated if text search affected
```

### Query Performance Rules
- `.lean()` on read-only queries for performance
- Projection specified (never fetch full document if subset needed)
- Aggregation pipelines preferred over multiple queries

---

## Auth Contract (JWT pattern — both stacks)

```
Protected route requirement:
  - Middleware: verifyToken (checks Authorization: Bearer <token>)
  - Token expiry: [15min access / 7d refresh — ASSUMED if not specified]
  - Refresh endpoint: POST /api/auth/refresh

Frontend contract:
  - Token stored in memory (not localStorage) — security standard
  - Axios interceptor handles 401 → auto-refresh
  - On refresh failure → redirect to /login
```

---

## State Management Contract (React)

For features requiring cross-component state, document:
```
STATE OWNER: [Context | Redux | Zustand | React Query | Local]
Shape: { field: type }
Who reads: [list of components]
Who mutates: [list of actions/functions]
Persistence: [none | sessionStorage | server sync]
```

Rule for small teams: prefer React Query for server state, Context for UI state.
Avoid Redux unless > 3 teams share state.