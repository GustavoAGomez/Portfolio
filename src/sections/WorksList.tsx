import { useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"
import gsap from "gsap"
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin"
import { PROJECTS, type Project } from "../config/projects"
import { useStore } from "../scroll/store"

gsap.registerPlugin(ScrambleTextPlugin)

const SCRAMBLE_CHARS = "01<>/\\[]#*+="
const LEAVE_DEBOUNCE = 140

/** Live clock + location + links. Absolute inside the section (easy to promote to fixed later). */
function CornerHud() {
  const [time, setTime] = useState(() => formatMadrid())
  useEffect(() => {
    const id = window.setInterval(() => setTime(formatMadrid()), 1000)
    return () => window.clearInterval(id)
  }, [])

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-end justify-between px-6 md:px-16 pb-8 text-[10px] md:text-xs tracking-[0.25em] uppercase text-white/50">
      <div>
        <p className="text-white/70">
          {time} <span className="text-white/35">Europe/Madrid</span>
        </p>
        <p className="mt-1">Madrid — 40.4168° N, 3.7038° W</p>
      </div>
      <nav className="pointer-events-auto flex gap-4 md:gap-6">
        <a href="https://github.com/GustavoAGomez" target="_blank" rel="noreferrer" className="transition-colors hover:text-[var(--color-accent-b)]">
          GitHub
        </a>
        <a href="#" className="transition-colors hover:text-[var(--color-accent-b)]">
          Email
        </a>
        <a href="#" className="transition-colors hover:text-[var(--color-accent-b)]">
          Instagram
        </a>
      </nav>
    </div>
  )
}

function formatMadrid(): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Madrid",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).format(new Date())
}

/**
 * Interactive "music-portfolio"-style works list (functionality only; styled to
 * the repo tokens). Lives in the Home `works` slot — pure DOM, no 3D behind it.
 * Hover/focus a row → scramble its metadata + crossfade its treated background +
 * dim the rest. Idle → subtle opacity loop. reduced-motion → static & readable.
 */
export function WorksList() {
  const reducedMotion = useStore((s) => s.reducedMotion)
  const [activeId, setActiveId] = useState<string | null>(null)

  const rowRefs = useRef<Record<string, HTMLAnchorElement | null>>({})
  const idle = useRef<gsap.core.Timeline | null>(null)
  const leaveTimer = useRef<number | null>(null)

  const activate = (id: string) => {
    if (leaveTimer.current !== null) {
      window.clearTimeout(leaveTimer.current)
      leaveTimer.current = null
    }
    setActiveId(id)
  }
  const scheduleDeactivate = () => {
    if (leaveTimer.current !== null) window.clearTimeout(leaveTimer.current)
    leaveTimer.current = window.setTimeout(() => setActiveId(null), LEAVE_DEBOUNCE)
  }

  useEffect(() => {
    return () => {
      if (leaveTimer.current !== null) window.clearTimeout(leaveTimer.current)
    }
  }, [])

  // Scramble on activate + idle opacity loop when nothing is active.
  useEffect(() => {
    if (reducedMotion) return
    const rows = Object.values(rowRefs.current).filter((el): el is HTMLAnchorElement => el !== null)
    const activeEl = activeId ? rowRefs.current[activeId] ?? null : null

    if (activeEl) {
      gsap.set(rows, { clearProps: "opacity" }) // hand opacity back to the CSS dim classes
      const targets = activeEl.querySelectorAll<HTMLElement>("[data-scramble]")
      gsap.to(targets, {
        duration: 0.7,
        ease: "none",
        stagger: 0.05,
        overwrite: true, // kill any prior tween on these same targets (rapid re-hover)
        scrambleText: { text: "{original}", chars: SCRAMBLE_CHARS, speed: 1, revealDelay: 0.1 }
      })
    } else if (activeId === null) {
      const tl = gsap.timeline({ repeat: -1, yoyo: true })
      tl.to(rows, { opacity: 0.5, duration: 1.6, ease: "sine.inOut", stagger: 0.15 })
      idle.current = tl
    }

    return () => {
      idle.current?.kill()
      idle.current = null
      // Cancel the in-flight scramble on the row we're leaving, snapping it to its
      // final text (progress(1)) so switching rows fast never leaves one half-decoded.
      if (activeEl) {
        activeEl.querySelectorAll<HTMLElement>("[data-scramble]").forEach((s) => {
          gsap.getTweensOf(s).forEach((t) => t.progress(1).kill())
        })
      }
      gsap.set(rows, { clearProps: "opacity" })
    }
  }, [activeId, reducedMotion])

  return (
    <div className="relative isolate min-h-screen w-full overflow-hidden pointer-events-auto">
      {/* Background — transparent at idle (the 3D canvas shows through, like the hero);
          the hovered project's image + a legibility veil fade in only while active. */}
      <div className="pointer-events-none absolute inset-0 z-0">
        {PROJECTS.map((p) => (
          <img
            key={p.id}
            src={p.image}
            alt=""
            aria-hidden="true"
            className={[
              "absolute inset-0 h-full w-full object-cover",
              reducedMotion ? "" : "transition-[opacity,transform] duration-700 ease-out",
              activeId === p.id ? "opacity-100" : "opacity-0",
              reducedMotion ? "" : activeId === p.id ? "scale-100" : "scale-105"
            ].join(" ")}
            style={{ filter: "grayscale(1) contrast(1.15) brightness(0.6)" }}
          />
        ))}
        {/* palette tint + dark scrim — visible ONLY while a row is active, so the
            title reads over the image; fully transparent (no veil) at idle. */}
        <div
          className={[
            "absolute inset-0",
            reducedMotion ? "" : "transition-opacity duration-700 ease-out",
            activeId ? "opacity-100" : "opacity-0"
          ].join(" ")}
        >
          <div className="absolute inset-0 bg-[var(--color-accent-b)] opacity-[0.06] mix-blend-overlay" />
          <div className="absolute inset-0 bg-[var(--color-bg)]/80" />
        </div>
      </div>

      {/* List */}
      <div className="relative z-10 flex min-h-screen flex-col px-6 md:px-16 py-16">
        <header className="flex items-baseline justify-between">
          <p className="text-xs tracking-[0.35em] uppercase text-white/60">Selected Work</p>
          <p className="text-xs tracking-[0.35em] uppercase text-white/35">{String(PROJECTS.length).padStart(3, "0")} —</p>
        </header>

        <ol className="mt-auto mb-auto flex flex-col divide-y divide-white/10" data-active={activeId ? "true" : "false"}>
          {PROJECTS.map((project) => (
            <WorkRow
              key={project.id}
              project={project}
              active={activeId === project.id}
              dimmed={activeId !== null && activeId !== project.id}
              reducedMotion={reducedMotion}
              refCb={(el) => {
                rowRefs.current[project.id] = el
              }}
              onActivate={() => activate(project.id)}
              onDeactivate={scheduleDeactivate}
            />
          ))}
        </ol>
      </div>

      <CornerHud />
    </div>
  )
}

interface WorkRowProps {
  project: Project
  active: boolean
  dimmed: boolean
  reducedMotion: boolean
  refCb: (el: HTMLAnchorElement | null) => void
  onActivate: () => void
  onDeactivate: () => void
}

function WorkRow({ project, active, dimmed, reducedMotion, refCb, onActivate, onDeactivate }: WorkRowProps) {
  const num = String(project.index).padStart(2, "0")
  return (
    <li>
      <Link
        ref={refCb}
        to={`/work/${project.id}`}
        aria-label={`${project.title} — ${project.role}, ${project.year}`}
        onMouseEnter={onActivate}
        onMouseLeave={onDeactivate}
        onFocus={onActivate}
        onBlur={onDeactivate}
        className={[
          "group flex flex-col gap-2 py-5 md:flex-row md:items-baseline md:justify-between md:gap-8 md:py-6",
          "transition-opacity duration-300 outline-none",
          "focus-visible:opacity-100",
          !reducedMotion && dimmed ? "opacity-40" : "opacity-100"
        ].join(" ")}
      >
        <div className="flex min-w-0 items-baseline gap-4 md:gap-8">
          <span className="font-display text-white/30 text-base md:text-2xl">{num}</span>
          <h3
            className={[
              "font-display uppercase leading-none tracking-tight text-5xl md:text-8xl transition-colors duration-300",
              active ? "neon-b" : "text-white group-hover:text-white"
            ].join(" ")}
          >
            {project.title}
          </h3>
        </div>
        <div className="flex shrink-0 items-baseline gap-3 text-[10px] md:text-xs tracking-[0.3em] uppercase text-white/60">
          <span data-scramble>{project.role}</span>
          {project.category && (
            <>
              <span className="text-white/20">/</span>
              <span data-scramble>{project.category}</span>
            </>
          )}
          <span className="text-white/20">/</span>
          <span data-scramble className="text-[var(--color-accent-b)]">
            {project.year}
          </span>
        </div>
      </Link>
    </li>
  )
}
