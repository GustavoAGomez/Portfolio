import { useEffect, useRef, useState } from "react"
import gsap from "gsap"
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin"
import { useStore } from "../scroll/store"
import { Decode } from "./Decode"

gsap.registerPlugin(ScrambleTextPlugin)

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
 *
 * All text plays the binary `01` decode the first time the HUD scrolls into view:
 * the static pieces (timezone label, location, link labels) via <Decode>; the
 * live clock via a ONE-SHOT scramble (a <Decode> would re-fire every second as
 * the time ticks), after which the per-second tick starts.
 */
export function CornerHud({ links = SITE_LINKS, variant = "overlay" }: CornerHudProps) {
  const reducedMotion = useStore((s) => s.reducedMotion)
  const [time, setTime] = useState(() => formatMadrid())
  // Hold the tick until the clock has decoded once, so the scramble isn't
  // overwritten mid-play by a setState. Reduced-motion ticks immediately.
  const [ticking, setTicking] = useState(reducedMotion)
  const clockRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!ticking) return
    const id = window.setInterval(() => setTime(formatMadrid()), 1000)
    return () => window.clearInterval(id)
  }, [ticking])

  // First-view one-shot decode of the live clock, then start ticking.
  useEffect(() => {
    const el = clockRef.current
    if (!el || reducedMotion) return
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (!entry?.isIntersecting) return
        io.disconnect() // decode once
        gsap.set(el, { autoAlpha: 1 })
        gsap.to(el, {
          duration: 0.7,
          ease: "none",
          scrambleText: { text: "{original}", chars: "01", speed: 1, revealDelay: 0.1 },
          onComplete: () => setTicking(true)
        })
      },
      { threshold: 0.6 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [reducedMotion])

  const positional = variant === "overlay" ? "absolute inset-x-0 bottom-0 z-20 pb-8" : "relative z-20 pb-8 pt-4"

  return (
    <div className={`pointer-events-none ${positional} flex items-end justify-between px-6 md:px-16 text-[10px] md:text-xs font-mono tracking-[0.25em] uppercase text-white/50`}>
      <div>
        <p className="text-white/70">
          <span ref={clockRef} style={reducedMotion ? undefined : { visibility: "hidden" }}>
            {time}
          </span>{" "}
          <span className="text-white/35">
            <Decode delay={0.1}>Europe/Madrid</Decode>
          </span>
        </p>
        <p className="mt-1">
          <Decode delay={0.16}>Madrid — 40.4168° N, 3.7038° W</Decode>
        </p>
      </div>
      <nav className="pointer-events-auto flex gap-4 md:gap-6">
        {links.map((l, i) => (
          <a
            key={l.label}
            href={l.href}
            {...(l.external ? { target: "_blank", rel: "noreferrer" } : {})}
            className="transition-colors hover:text-[var(--color-accent-b)]"
          >
            <Decode delay={0.1 + i * 0.08}>{l.label}</Decode>
          </a>
        ))}
      </nav>
    </div>
  )
}
