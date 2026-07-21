import { useEffect, useState } from "react"

export interface HudLink {
  label: string
  href: string
  /** External links open in a new tab; mailto/internal links do not. */
  external?: boolean
}

/**
 * Canonical site contact links (LinkedIn + Gmail). Default for every page's HUD,
 * so the footer stays identical across Home and the case studies.
 */
export const SITE_LINKS: HudLink[] = [
  { label: "LinkedIn", href: "https://www.linkedin.com/in/gustavoagomez93/", external: true },
  { label: "Gmail", href: "mailto:stgustavo.gomez@gmail.com" }
]

function formatMadrid(): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Madrid",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).format(new Date())
}

interface CornerHudProps {
  links?: HudLink[]
  /**
   * `overlay` pins it to the bottom of its (relative) container — used on the
   * Home over the works list. `block` flows in normal document order — used at
   * the bottom of every case study, below "Siguiente proyecto".
   */
  variant?: "overlay" | "block"
}

/**
 * Live clock + location + contact links. Shared footer HUD, componentized so the
 * same strip renders on every page (Home works list + case-study footers).
 * Absolute inside its section on the Home; static in flow everywhere else.
 */
export function CornerHud({ links = SITE_LINKS, variant = "overlay" }: CornerHudProps) {
  const [time, setTime] = useState(() => formatMadrid())
  useEffect(() => {
    const id = window.setInterval(() => setTime(formatMadrid()), 1000)
    return () => window.clearInterval(id)
  }, [])

  const positional = variant === "overlay" ? "absolute inset-x-0 bottom-0 z-20 pb-8" : "relative z-20 pb-8 pt-4"

  return (
    <div className={`pointer-events-none ${positional} flex items-end justify-between px-6 md:px-16 text-[10px] md:text-xs tracking-[0.25em] uppercase text-white/50`}>
      <div>
        <p className="text-white/70">
          {time} <span className="text-white/35">Europe/Madrid</span>
        </p>
        <p className="mt-1">Madrid — 40.4168° N, 3.7038° W</p>
      </div>
      <nav className="pointer-events-auto flex gap-4 md:gap-6">
        {links.map((l) => (
          <a
            key={l.label}
            href={l.href}
            {...(l.external ? { target: "_blank", rel: "noreferrer" } : {})}
            className="transition-colors hover:text-[var(--color-accent-b)]"
          >
            {l.label}
          </a>
        ))}
      </nav>
    </div>
  )
}
