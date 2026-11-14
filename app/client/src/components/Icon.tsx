/**
 * The prototype's icon set (`ICON` in index-q.html), stroke 1.5 on a 24 grid.
 * One set for the whole app, so a pencil always means "edit this value" and a
 * tuner always means "settings of this page".
 */
const PATHS = {
  gauge: (
    <>
      <path d="M4 18a8 8 0 1 1 16 0" />
      <path d="M12 18l4.2-5" />
      <circle cx="12" cy="18" r="1.2" fill="currentColor" stroke="none" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="0.7" fill="currentColor" stroke="none" />
    </>
  ),
  link: (
    <>
      <path d="M9.5 14.5 14.5 9.5" />
      <path d="M11 6.5 13 4.5a3.5 3.5 0 0 1 5 5l-2 2" />
      <path d="M13 17.5 11 19.5a3.5 3.5 0 0 1-5-5l2-2" />
    </>
  ),
  people: (
    <>
      <circle cx="9" cy="8.5" r="3.2" />
      <path d="M3.5 19.5c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
      <path d="M16 6.2a3 3 0 0 1 0 5.6" />
      <path d="M17.5 19.5c0-2.2-.8-3.8-2-4.7" />
    </>
  ),
  chart: (
    <>
      <path d="M4 19.5V13" />
      <path d="M9.3 19.5V7" />
      <path d="M14.7 19.5v-9" />
      <path d="M20 19.5V4.5" />
    </>
  ),
  award: (
    <>
      <circle cx="12" cy="9" r="5.2" />
      <path d="M8.6 13.4 7.5 20l4.5-2.4 4.5 2.4-1.1-6.6" />
    </>
  ),
  book: (
    <>
      <path d="M4.5 4.8h10a2.5 2.5 0 0 1 2.5 2.5v12H7a2.5 2.5 0 0 1-2.5-2.5z" />
      <path d="M17 4.8h2.5v14.5H17" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M5 20c0-3.4 3.1-5.6 7-5.6s7 2.2 7 5.6" />
    </>
  ),
  check: <path d="M4.5 12.5 9.5 17.5 19.5 6.5" />,
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.6" />
      <rect x="14" y="3" width="7" height="7" rx="1.6" />
      <rect x="3" y="14" width="7" height="7" rx="1.6" />
      <rect x="14" y="14" width="7" height="7" rx="1.6" />
    </>
  ),
  up: (
    <>
      <path d="M12 19V6" />
      <path d="M6 11.5 12 5.5l6 6" />
      <path d="M4.5 20.5h15" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4 4" />
    </>
  ),
  close: <path d="M6 6l12 12M18 6L6 18" />,
  lock: (
    <>
      <rect x="4.5" y="10.5" width="15" height="9.5" rx="2" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
    </>
  ),
  edit: (
    <>
      <path d="M4.5 19.5h4l10-10a2.83 2.83 0 0 0-4-4l-10 10v4z" />
      <path d="M13.5 6.5l4 4" />
    </>
  ),
  tune: (
    <>
      <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
      <circle cx="15" cy="7" r="2" />
      <circle cx="9" cy="17" r="2" />
    </>
  ),
  copy: (
    <>
      <rect x="8.5" y="8.5" width="11" height="11" rx="2" />
      <path d="M15.5 5.5h-9a2 2 0 0 0-2 2v9" />
    </>
  ),
  trash: (
    <>
      <path d="M4.5 6.5h15" />
      <path d="M9.5 6.5V5a1.5 1.5 0 0 1 1.5-1.5h2A1.5 1.5 0 0 1 14.5 5v1.5" />
      <path d="M6.5 6.5 7.4 19a1.5 1.5 0 0 0 1.5 1.4h6.2a1.5 1.5 0 0 0 1.5-1.4l.9-12.5" />
      <path d="M10.5 10v6M13.5 10v6" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  plus: <path d="M12 5v14M5 12h14" />,
} as const

export type IconName = keyof typeof PATHS

export function Icon({
  name,
  className = "h-[17px] w-[17px]",
}: {
  name: IconName
  className?: string
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  )
}
