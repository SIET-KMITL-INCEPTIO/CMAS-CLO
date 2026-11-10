import type { User } from "../../types/user.types.ts"

/**
 * What a sign-in call returns. Mirrors AuthController.loginWithGoogle's two 200
 * shapes; the refresh token is an httpOnly cookie (S-2), never in the body.
 */
export type LoginResponse =
  { status: "PENDING"; message: string } | { status: "ACTIVE"; user: User; accessToken: string }
