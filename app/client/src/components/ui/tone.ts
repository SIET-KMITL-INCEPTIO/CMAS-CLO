/** The five status tones of index-q.html (`TONE`). Status colours live here and nowhere else. */
export const TONE = {
  ok: { bg: "#E7EFEA", tx: "#4F7C68", bar: "#6E9C87" },
  warn: { bg: "#F4EEE1", tx: "#7D6430", bar: "#C7A860" },
  bad: { bg: "#F4E8E8", tx: "#A2504F", bar: "#B96F6E" },
  info: { bg: "#E9ECF6", tx: "#4A5A86", bar: "#8C97BE" },
  nil: { bg: "#F1F2F8", tx: "#878CB4", bar: "#C8CDEB" },
} as const
export type Tone = keyof typeof TONE
