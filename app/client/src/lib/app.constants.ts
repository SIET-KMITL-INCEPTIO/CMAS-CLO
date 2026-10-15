// VITE_API_URL is the server's ORIGIN (as in .env.example). Every route lives
// under /api/v1 (G-1, G-2), so the prefix is added here once instead of in
// each person's .env.
const API_ORIGIN: string = import.meta.env.VITE_API_URL ?? "http://localhost:3001"
export const API_URL = `${API_ORIGIN.replace(/\/+$/, "")}/api/v1`
export const GOOGLE_CLIENT_ID: string = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ""

export const CLO_STATUS_COLORS = {
  pass: "bg-green-100 text-green-800",
  risk: "bg-red-100 text-red-800",
  warn: "bg-yellow-100 text-yellow-800",
} as const

export type CloStatus = keyof typeof CLO_STATUS_COLORS
