import { useEffect, useRef, useState, type MouseEvent } from "react"
import { useLocation } from "react-router-dom"
import gsap from "gsap"
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin"
import { useStore } from "../scroll/store"
import { useTransition } from "../transition/TransitionProvider"
import { Decode } from "./Decode"
import type { L10n } from "../config/projects"

gsap.registerPlugin(ScrambleTextPlugin)

export interface HudLink {
  label: L10n
  href: string
  external?: boolean
  internal?: boolean
}

export const SITE_LINKS: HudLink[] = [
  { label: { es: "Sobre mí", en: "About" }, href: "/about", internal: true },
  { label: { es: "LinkedIn", en: "LinkedIn" }, href: "https://www.linkedin.com/in/gustavoagomez93/", external: true },
  { label: { es: "Gmail", en: "Gmail" }, href: "mailto:stgustavo.gomez@gmail.com" }
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
  variant?: "overlay" | "block"
}

export function CornerHud({ links = SITE_LINKS, variant = "overlay" }: CornerHudProps) {
  const reducedMotion = useStore((s) => s.reducedMotion)
  const locale = useStore((s) => s.locale)
  const { go } = useTransition()
  const { pathname } = useLocation()
  const visibleLinks = links.filter((l) => !(l.internal && pathname === l.href))
  const [time, setTime] = useState(() => formatMadrid())
  // Hold the tick until the clock has decoded once — a setState mid-play would
  // overwrite the scramble.
  const [ticking, setTicking] = useState(reducedMotion)
  const clockRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!ticking) return
    const id = window.setInterval(() => setTime(formatMadrid()), 1000)
    return () => window.clearInterval(id)
  }, [ticking])

  useEffect(() => {
    const el = clockRef.current
    if (!el || reducedMotion) return
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (!entry?.isIntersecting) return
        io.disconnect()
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

  const positional =
    variant === "overlay"
      ? "absolute inset-x-0 bottom-0 z-20 pb-[max(2rem,env(safe-area-inset-bottom))]"
      : "relative z-20 pb-[max(2rem,env(safe-area-inset-bottom))] pt-4"

  return (
    <div
      className={`pointer-events-none ${positional} content-max flex flex-col items-start gap-3 md:flex-row md:items-end md:justify-between px-6 md:px-16 text-[10px] md:text-xs font-mono tracking-[0.15em] md:tracking-[0.25em] uppercase text-white/50`}
    >
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
        {visibleLinks.map((l, i) => {
          const onClick = l.internal
            ? (e: MouseEvent<HTMLAnchorElement>) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
                e.preventDefault()
                go(l.href)
              }
            : undefined
          return (
            <a
              key={l.href}
              href={l.href}
              onClick={onClick}
              {...(l.external ? { target: "_blank", rel: "noreferrer" } : {})}
              className="hover-neon-b"
            >
              <Decode delay={0.1 + i * 0.08}>{l.label[locale]}</Decode>
            </a>
          )
        })}
      </nav>
    </div>
  )
}
