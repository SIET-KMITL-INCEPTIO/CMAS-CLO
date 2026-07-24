import { describe, expect, it } from "vitest"
import { envSchema } from "./env.schema.js"

const valid = {
  DATABASE_URL: "postgresql://postgres:pw@db.example.supabase.co:5432/postgres",
  JWT_SECRET: "a".repeat(32),
}

describe("envSchema", () => {
  it("applies documented defaults when optional vars are absent", () => {
    const env = envSchema.parse(valid)

    expect(env.NODE_ENV).toBe("development")
    expect(env.PORT).toBe(3001)
    expect(env.JWT_ACCESS_EXPIRES_IN).toBe("15m")
    expect(env.JWT_REFRESH_EXPIRES_IN).toBe("7d")
    expect(env.CORS_ORIGIN).toBe("http://localhost:5173")
    expect(env.RATE_LIMIT_MAX).toBe(100)
    expect(env.RATE_LIMIT_WINDOW).toBe("1 minute")
  })

  it("rejects a JWT_SECRET shorter than 32 characters", () => {
    const result = envSchema.safeParse({ ...valid, JWT_SECRET: "too-short" })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain("at least 32 characters")
    }
  })

  it("requires DATABASE_URL", () => {
    expect(envSchema.safeParse({ JWT_SECRET: valid.JWT_SECRET }).success).toBe(false)
  })

  it("rejects an empty DATABASE_URL", () => {
    expect(envSchema.safeParse({ ...valid, DATABASE_URL: "" }).success).toBe(false)
  })

  it("coerces numeric vars supplied as strings, as process.env always does", () => {
    const env = envSchema.parse({ ...valid, PORT: "8080", RATE_LIMIT_MAX: "50" })

    expect(env.PORT).toBe(8080)
    expect(env.RATE_LIMIT_MAX).toBe(50)
  })

  it("rejects an unknown NODE_ENV", () => {
    expect(envSchema.safeParse({ ...valid, NODE_ENV: "staging" }).success).toBe(false)
  })
})
