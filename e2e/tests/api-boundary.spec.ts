import { expect, test } from "@playwright/test"
import { API, prisma, seededUser, signToken } from "../support/session"

// The auth boundary over real HTTP, against the built server. The unit tests
// cover the same rules through Fastify's inject(); this proves the compiled
// output, env parsing, helmet and CORS behave the same way once deployed.

test.afterAll(async () => {
  await prisma.$disconnect()
})

test("health is public", async ({ request }) => {
  const res = await request.get(`${API}/health`)
  expect(res.status()).toBe(200)
  expect((await res.json()).data.status).toBe("ok")
})

test("responses carry helmet headers and hide the framework", async ({ request }) => {
  const res = await request.get(`${API}/health`)
  expect(res.headers()["x-content-type-options"]).toBe("nosniff")
  expect(res.headers()["x-powered-by"]).toBeUndefined()
})

test("CORS allows only the configured client origin", async ({ request }) => {
  // A string `origin` makes @fastify/cors answer with that fixed value, so a
  // foreign page gets a header naming someone else and the browser blocks it.
  for (const origin of ["http://localhost:5173", "https://evil.example"]) {
    const res = await request.get(`${API}/health`, { headers: { Origin: origin } })
    expect(res.headers()["access-control-allow-origin"]).toBe("http://localhost:5173")
  }
})

test("the CORS preflight allows the methods the client sends", async ({ request }) => {
  // The default (GET, HEAD, POST) made the browser refuse PATCH /users/:id/approve.
  for (const method of ["PATCH", "PUT", "DELETE"]) {
    const res = await request.fetch(`${API}/users/x/approve`, {
      method: "OPTIONS",
      headers: {
        Origin: "http://localhost:5173",
        "Access-Control-Request-Method": method,
        "Access-Control-Request-Headers": "authorization,content-type",
      },
    })
    expect(res.status()).toBe(204)
    expect(res.headers()["access-control-allow-methods"]).toContain(method)
  }
})

test.describe("GET /users (cap user.manage, ADMIN only)", () => {
  test("no token → 401", async ({ request }) => {
    expect((await request.get(`${API}/users`)).status()).toBe(401)
  })

  test("token signed with another secret → 401", async ({ request }) => {
    const admin = await seededUser("admin@cmas.local")
    const forged = signToken(admin.id, "ADMIN", { secret: "x".repeat(64) })
    const res = await request.get(`${API}/users`, {
      headers: { Authorization: `Bearer ${forged}` },
    })
    expect(res.status()).toBe(401)
  })

  test("refresh token sent as an access token → 401 (S-1)", async ({ request }) => {
    const admin = await seededUser("admin@cmas.local")
    const refresh = signToken(admin.id, "ADMIN", { typ: "refresh" })
    const res = await request.get(`${API}/users`, {
      headers: { Authorization: `Bearer ${refresh}` },
    })
    expect(res.status()).toBe(401)
  })

  test("a role claim the live row does not back → 403", async ({ request }) => {
    // An INSTRUCTOR whose token claims ADMIN: authMiddleware re-reads the row.
    const instructor = await seededUser("instructor1@cmas.local")
    const lying = signToken(instructor.id, "ADMIN")
    const res = await request.get(`${API}/users`, { headers: { Authorization: `Bearer ${lying}` } })
    expect(res.status()).toBe(403)
  })

  test("ADMIN → 200", async ({ request }) => {
    const admin = await seededUser("admin@cmas.local")
    const res = await request.get(`${API}/users`, {
      headers: { Authorization: `Bearer ${signToken(admin.id, "ADMIN")}` },
    })
    expect(res.status()).toBe(200)
  })
})
