export const API_URL: string = import.meta.env.VITE_API_URL ?? "http://localhost:3001"

export const CLO_STATUS_COLORS = {
  pass: "bg-green-100 text-green-800",
  risk: "bg-red-100 text-red-800",
  warn: "bg-yellow-100 text-yellow-800",
} as const

export type CloStatus = keyof typeof CLO_STATUS_COLORS
