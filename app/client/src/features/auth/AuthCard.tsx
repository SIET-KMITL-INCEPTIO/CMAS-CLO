import type { ReactNode } from "react"

/** The sign-in backdrop and card; the screens put their own body inside. */
export default function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: ReactNode
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[image:var(--bg-field)] px-4 py-8 text-ink">
      <div className="flex w-full max-w-105 flex-col gap-4 rounded-[18px] bg-card p-7 shadow-card">
        <div>
          <div className="mb-3 text-[13px] tracking-wide text-ink-soft">&lt;/&gt; CMAS</div>
          <h1 className="text-2xl leading-tight font-light tracking-normal">{title}</h1>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  )
}
