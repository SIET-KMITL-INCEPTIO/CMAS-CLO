/**
 * The five status tones of index-q.html (`TONE`). Status colours live here and nowhere else.
 *
 * The values are CSS variables, not hex: a tone is used in inline styles and
 * chart props, which no Tailwind class or theme override can reach, so a hex
 * here stays light-coloured in the dark theme. The variables are in
 * styles/tokens.css, where the light values equal the prototype's hex.
 */
export const TONE = {
  ok: { bg: "var(--color-okBg)", tx: "var(--color-ok)", bar: "var(--color-okBar)" },
  warn: { bg: "var(--color-warnBg)", tx: "var(--color-warn)", bar: "var(--color-warnBar)" },
  bad: { bg: "var(--color-badBg)", tx: "var(--color-bad)", bar: "var(--color-badBar)" },
  info: { bg: "var(--color-infoBg)", tx: "var(--color-info)", bar: "var(--color-infoBar)" },
  nil: { bg: "var(--color-nilBg)", tx: "var(--color-nil)", bar: "var(--color-nilBar)" },
} as const
export type Tone = keyof typeof TONE
