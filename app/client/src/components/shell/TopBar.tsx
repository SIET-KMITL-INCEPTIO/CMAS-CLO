/**
 * The command bar (`.cmdbar`): brand, the pane toggle on narrow screens, the
 * search that opens the palette (Ctrl K), and the account button.
 */
import { useEffect, useRef, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { useAuthStore } from "../../features/auth/useAuthStore.ts"
import { loadPicture } from "../../lib/avatar.ts"
import { endSession } from "../../lib/session.ts"
import { Icon } from "../Icon.tsx"
import { CommandPalette } from "./CommandPalette.tsx"
import { DENSITIES, SCALES, useDisplay } from "./display.ts"
import { Modal } from "../overlay/Sheet.tsx"

const ROLE_TH = { ADMIN: "ผู้ดูแลระบบ", INSTRUCTOR: "ผู้สอน" } as const

/** "ผศ.ดร. สมชาย ใจดี" → "สม": the first name, past any title (index-q paintShell). */
const initials = (name: string) =>
  name.replace(/^[^\s]*\s?/, "").slice(0, 2) || name.slice(0, 2) || "CM"

/** The Google picture when this browser has one, else the initials (index-q paintShell). */
function Avatar({ id, name }: { id: string; name: string }) {
  const [url, setUrl] = useState(() => loadPicture(id))
  const box = "grid h-7 w-7 shrink-0 place-items-center overflow-hidden rounded-full"
  if (url)
    return (
      <span className={box}>
        {/* no-referrer: Google's image host refuses some requests that carry one. */}
        <img
          src={url}
          alt=""
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
          onError={() => setUrl(null)}
        />
      </span>
    )
  return (
    <span
      className={`${box} text-[12.5px] text-white`}
      style={{ background: "linear-gradient(135deg,#8A90C0,#3C456A)" }}
    >
      {initials(name)}
    </span>
  )
}

export function TopBar({ onTogglePane }: { onTogglePane: () => void }) {
  const me = useAuthStore((s) => s.me)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [displayOpen, setDisplayOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const display = useDisplay()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setPaletteOpen(true)
      }
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [])

  useEffect(() => {
    if (!menuOpen) return
    const close = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false)
    document.addEventListener("mousedown", close)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", close)
      document.removeEventListener("keydown", onKey)
    }
  }, [menuOpen])

  const signOut = async () => {
    setMenuOpen(false)
    await endSession(queryClient)
    navigate("/auth/login", { replace: true })
  }

  return (
    <header className="cmdbar no-print">
      <span className="brand">&lt;/&gt;</span>
      <button
        type="button"
        className="paneToggle h-8 w-8 place-items-center rounded-[6px] text-white/85 hover:bg-white/15"
        onClick={onTogglePane}
        aria-label="เปิด/ปิดรายการ"
      >
        <Icon name="menu" />
      </button>
      <span className="hidden text-[15px] text-white/95 sm:inline">CMAS</span>
      <button type="button" className="cmdsearch" onClick={() => setPaletteOpen(true)}>
        <span>ค้นหารายวิชา หรือหน้าจอ</span>
        <span className="ml-auto opacity-70">
          <kbd>Ctrl</kbd> <kbd>K</kbd>
        </span>
      </button>

      <div className="cmdright" ref={menuRef}>
        <button
          type="button"
          className="flex items-center gap-2 rounded-[6px] py-1 pr-1 pl-2 hover:bg-white/10"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((o) => !o)}
        >
          <span className="hidden text-right md:block">
            <span className="block text-[14px] leading-tight text-white">{me?.name}</span>
            <span className="block text-[12px] leading-tight text-white/70">
              {me ? ROLE_TH[me.role] : ""}
            </span>
          </span>
          {me && <Avatar id={me.id} name={me.name} />}
        </button>
        {menuOpen && me && (
          <div className="acctmenu no-print" role="menu">
            <div className="px-2.5 pt-1.5 pb-2">
              <div className="text-[14px] text-ink">{me.name}</div>
              <div className="truncate text-[12.5px] text-dim">{me.email}</div>
            </div>
            <div className="hair mb-1" />
            <button
              type="button"
              role="menuitem"
              className="acctitem"
              onClick={() => {
                setMenuOpen(false)
                setDisplayOpen(true)
              }}
            >
              การแสดงผล
            </button>
            <button type="button" role="menuitem" className="acctitem" onClick={signOut}>
              ออกจากระบบ
            </button>
          </div>
        )}
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      <Modal open={displayOpen} onClose={() => setDisplayOpen(false)} title="การแสดงผล">
        <div className="grid gap-5">
          <fieldset>
            <legend className="mb-2 text-[14px] text-ink">ขนาดตัวอักษร</legend>
            <div className="flex flex-wrap gap-2">
              {SCALES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className="chipbtn"
                  aria-current={display.scale === s.id}
                  onClick={() => display.set({ scale: s.id })}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="mb-2 text-[14px] text-ink">ความหนาแน่นของแถวในตาราง</legend>
            <div className="flex flex-wrap gap-2">
              {DENSITIES.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  className="chipbtn"
                  aria-current={display.density === d.id}
                  onClick={() => display.set({ density: d.id })}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </fieldset>
        </div>
      </Modal>
    </header>
  )
}
