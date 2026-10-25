/**
 * bloomChip / soloChip of index-q.html. A missing level is shown as a prompt,
 * never as a default: a wrong level is worse than a missing one.
 */
import { TONE } from "../../components/ui/tone.ts"
import { BLOOM, SOLO, type Bloom, type Solo } from "./clo.types.ts"
import { BLOOM_TH, SOLO_HINT, SOLO_TH } from "./useClos.ts"

/** Light → dark with the level (PAL.bloom / PAL.solo in the prototype). */
const BLOOM_SHADE = ["#F1F2F8", "#E6E8F4", "#D6DAEE", "#C8CDEB", "#AFAECC", "#85758F"]
const SOLO_SHADE = ["#E6E8F4", "#C8CDEB", "#85758F"]

const missing = (what: string) => (
  <span
    className="rounded-xs px-2 py-1 text-[12.5px] whitespace-nowrap"
    style={{ background: TONE.warn.bg, color: TONE.warn.tx }}
  >
    ยังไม่ระบุระดับ {what}
  </span>
)

export function BloomChip({ level }: { level: Bloom | null }) {
  if (!level) return missing("Bloom")
  const rank = BLOOM.indexOf(level)
  return (
    <span
      className="rounded-xs px-2 py-1 text-[12px] whitespace-nowrap"
      style={{ background: BLOOM_SHADE[rank], color: rank >= 4 ? "#fff" : "var(--ink)" }}
      title={`Bloom · ${level}`}
    >
      L{rank + 1} {BLOOM_TH[level]}
    </span>
  )
}

export function SoloChip({ level }: { level: Solo | null }) {
  if (!level) return missing("SOLO")
  const rank = SOLO.indexOf(level)
  return (
    <span
      className="rounded-xs px-2 py-1 text-[12px] whitespace-nowrap"
      style={{ background: SOLO_SHADE[rank], color: rank === 2 ? "#fff" : "var(--ink)" }}
      title={`SOLO · ${SOLO_HINT[level]}`}
    >
      S{rank + 1} {SOLO_TH[level]}
    </span>
  )
}
