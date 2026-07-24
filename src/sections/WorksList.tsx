import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type FocusEvent, type MouseEvent } from "react"
import { Link } from "react-router-dom"
import gsap from "gsap"
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin"
import { PROJECTS, type Project } from "../config/projects"
import { useStore } from "../scroll/store"
import { useTransition } from "../transition/TransitionProvider"
import { CornerHud } from "../components/CornerHud"
import { Decode } from "../components/Decode"

gsap.registerPlugin(ScrambleTextPlugin)

const SCRAMBLE_CHARS = "01"

/**
 * Scramble each `[data-scramble]` target TOWARD its real text (read from
 * `data-text`, NOT the live `textContent`). Using the stored real text instead
 * of gsap's `"{original}"` is what fixes the first-view↔hover collision: if a
 * hover scramble starts while the first-view decode is mid-flight, `"{original}"`
 * would capture the intermediate binary as the target and leave it as binary
 * forever. `overwrite:true` kills any in-flight tween on the same target so the
 * latest scramble always wins and always lands on the real text.
 */
function scrambleToReal(targets: ArrayLike<HTMLElement>, stagger: number): void {
  Array.from(targets).forEach((t, i) => {
    const text = t.getAttribute("data-text") ?? t.textContent ?? ""
    gsap.to(t, {
      duration: 0.7,
      delay: i * stagger,
      ease: "none",
      overwrite: true,
      scrambleText: { text, chars: SCRAMBLE_CHARS, speed: 1, revealDelay: 0.1 }
    })
  })
}

interface RowRect {
  id: string
  /** Offsets relative to the <ol> top (stable across scroll; re-measured on resize). */
  top: number
  bottom: number
}

/**
 * Interactive works list (styled to the repo tokens). Lives in the Home `works`
 * slot — transparent at idle so the 3D canvas shows through.
 *
 * Selection is DETERMINISTIC BY POSITION (not mouseenter/leave): a single move
 * handler maps clientY → the row whose cached [top,bottom) contains it, so the
 * 1px border between rows never oscillates. The hovered image + veil show ONLY
 * while a row is under the pointer/focus; leaving the list clears them (back to
 * the transparent web background).
 */
export function WorksList() {
  const reducedMotion = useStore((s) => s.reducedMotion)
  const [activeId, setActiveId] = useState<string | null>(null)

  const rowRefs = useRef<Record<string, HTMLAnchorElement | null>>({})
  const olRef = useRef<HTMLOListElement>(null)
  const rowRects = useRef<RowRect[]>([])

  // Cache row rects relative to the <ol> (measured on mount + resize, NOT per move).
  const measure = useCallback(() => {
    const ol = olRef.current
    if (!ol) return
    const olTop = ol.getBoundingClientRect().top
    const rects: RowRect[] = []
    for (const p of PROJECTS) {
      const el = rowRefs.current[p.id]
      if (!el) continue
      const r = el.getBoundingClientRect()
      rects.push({ id: p.id, top: r.top - olTop, bottom: r.bottom - olTop })
    }
    rects.sort((a, b) => a.top - b.top)
    // Make intervals contiguous so the 1px divider is never a dead zone.
    for (let i = 0; i < rects.length - 1; i++) {
      const curr = rects[i]
      const next = rects[i + 1]
      if (curr && next) curr.bottom = next.top
    }
    rowRects.current = rects
  }, [])

  useLayoutEffect(() => {
    measure()
    const ol = olRef.current
    const ro = new ResizeObserver(measure)
    if (ol) ro.observe(ol)
    window.addEventListener("resize", measure)
    return () => {
      ro.disconnect()
      window.removeEventListener("resize", measure)
    }
  }, [measure])

  // clientY → row under the pointer (only the <ol> rect is read live, per move).
  const selectAt = (clientY: number) => {
    const ol = olRef.current
    if (!ol) return
    const y = clientY - ol.getBoundingClientRect().top
    for (const r of rowRects.current) {
      if (y >= r.top && y < r.bottom) {
        setActiveId(r.id)
        return
      }
    }
  }

  // Clear when the pointer leaves the list (mouse) or focus exits it (keyboard).
  const handleListBlur = (e: FocusEvent<HTMLOListElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setActiveId(null)
  }

  // Scramble the active row's meta on hover/focus. Idle rows rest at full opacity
  // (no breathing pulse) so nothing animates when the list isn't being touched.
  useEffect(() => {
    if (reducedMotion) return
    const rows = Object.values(rowRefs.current).filter((el): el is HTMLAnchorElement => el !== null)
    const activeEl = activeId ? rowRefs.current[activeId] ?? null : null
    if (!activeEl) return

    gsap.set(rows, { clearProps: "opacity" }) // hand opacity back to the CSS dim classes
    const targets = activeEl.querySelectorAll<HTMLElement>("[data-scramble]")
    // Scramble toward the REAL text (data-text), overwriting any in-flight
    // first-view decode so hover mid-decode can't freeze the row in binary.
    scrambleToReal(targets, 0.05)

    return () => {
      // Cancel the in-flight scramble on the row we're leaving, snapping it to its
      // final text (progress(1)) so switching rows fast never leaves one half-decoded.
      activeEl.querySelectorAll<HTMLElement>("[data-scramble]").forEach((s) => {
        gsap.getTweensOf(s).forEach((t) => t.progress(1).kill())
      })
      gsap.set(rows, { clearProps: "opacity" })
    }
  }, [activeId, reducedMotion])

  return (
    <div
      className="relative isolate min-h-svh w-full overflow-hidden pointer-events-auto"
      // Touch: a tap on the empty area (outside the rows) dismisses the preview.
      onPointerDown={(e) => {
        if (e.pointerType === "touch" && !olRef.current?.contains(e.target as Node)) setActiveId(null)
      }}
    >
      {/* Background — transparent at idle; the active/persisted project's image
          zooms IN + a legibility veil fades in, and both stay until reset. */}
      <div className="pointer-events-none absolute inset-0 z-0">
        {PROJECTS.map((p) => (
          <WorkBackdrop key={p.id} project={p} visible={activeId === p.id} reducedMotion={reducedMotion} />
        ))}
        {/* palette tint + dark scrim — visible while a row is active/persisted. */}
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
      <div className="relative z-10 flex min-h-svh flex-col px-6 md:px-16 py-16">
        <header className="flex items-baseline justify-between">
          <p className="text-xs font-mono tracking-[0.35em] uppercase text-white/60">
            <Decode>Selected Work</Decode>
          </p>
          {/* <p className="text-xs font-mono tracking-[0.35em] uppercase text-white/35">{String(PROJECTS.length).padStart(3, "0")} —</p> */}
        </header>

        <ol
          ref={olRef}
          className="mt-auto mb-auto flex flex-col divide-y divide-white/10"
          data-active={activeId ? "true" : "false"}
          onMouseMove={(e) => selectAt(e.clientY)}
          onPointerMove={(e) => {
            if (e.pointerType !== "touch") selectAt(e.clientY)
          }}
          onMouseLeave={() => setActiveId(null)}
          onBlur={handleListBlur}
        >
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
              onActivate={() => setActiveId(project.id)}
            />
          ))}
        </ol>
      </div>

      <CornerHud />
    </div>
  )
}

interface WorkBackdropProps {
  project: Project
  visible: boolean
  reducedMotion: boolean
}

/**
 * Full-bleed hover background for one row. If the project has a `hoverVideo` (and
 * motion is allowed) it plays that muted clip in a loop while the row is active —
 * with `image` as the poster so there's no blank frame before the video decodes —
 * and pauses when it isn't. Otherwise (or under reduced-motion) it's the still
 * image. Same grayscale + zoom-in language either way.
 */
function WorkBackdrop({ project, visible, reducedMotion }: WorkBackdropProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const useVideo = !!project.hoverVideo && !reducedMotion

  // Play only while hovered; pause (keeping the last frame) otherwise. The play()
  // promise can reject if the pointer leaves before it resolves — swallow it.
  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    if (visible) void v.play().catch(() => {})
    else v.pause()
  }, [visible])

  const style: CSSProperties = {
    filter: "grayscale(1) contrast(1.15) brightness(0.6)",
    opacity: visible ? 1 : 0,
    // Zoom-IN on appear: 1.0 → 1.18, with the transform running MUCH longer than
    // the fade so the growth keeps moving after the media is opaque.
    transform: reducedMotion ? undefined : `scale(${visible ? 1.18 : 1})`,
    transition: reducedMotion ? undefined : "opacity 600ms ease-out, transform 1400ms cubic-bezier(0.22, 0.61, 0.36, 1)"
  }

  if (useVideo) {
    return (
      <video
        ref={videoRef}
        src={project.hoverVideo}
        poster={project.image}
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover"
        style={style}
      />
    )
  }

  return <img src={project.image} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" style={style} />
}

interface WorkRowProps {
  project: Project
  active: boolean
  dimmed: boolean
  reducedMotion: boolean
  refCb: (el: HTMLAnchorElement | null) => void
  onActivate: () => void
}

function WorkRow({ project, active, dimmed, reducedMotion, refCb, onActivate }: WorkRowProps) {
  const { go } = useTransition()
  const to = `/work/${project.id}`
  const rowRef = useRef<HTMLAnchorElement | null>(null)
  // Touch two-tap: `active` captured at touch-down, BEFORE the tap's focus/state
  // updates land — null means the interaction didn't start as a touch.
  const touchWasActive = useRef<boolean | null>(null)

  // First-view decode of the row's meta (role / category / year): scramble the
  // same [data-scramble] spans the hover uses, once, when the row scrolls in.
  // Reuses the hover mechanism (mutating textContent) so it never fights React.
  useEffect(() => {
    const el = rowRef.current
    if (!el || reducedMotion) return
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (!entry?.isIntersecting) return
        io.disconnect() // decode once
        // Toward the REAL text (data-text) + overwrite, so a hover landing
        // mid-decode can't leave the row stuck in binary (and vice versa).
        scrambleToReal(el.querySelectorAll<HTMLElement>("[data-scramble]"), 0.06)
      },
      { threshold: 0.6 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [reducedMotion])

  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    // Let modified clicks (new tab / middle button) behave natively.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
    // Touch: hover doesn't exist, so the FIRST tap plays the hover preview
    // (backdrop video + scramble) and only a second tap on the same row navigates.
    if (touchWasActive.current === false) {
      touchWasActive.current = null
      e.preventDefault()
      onActivate()
      return
    }
    touchWasActive.current = null
    e.preventDefault()
    go(to)
  }

  return (
    <li>
      <Link
        ref={(el) => {
          rowRef.current = el
          refCb(el)
        }}
        to={to}
        aria-label={`${project.title} — ${project.role}, ${project.year}`}
        onFocus={onActivate}
        onPointerDown={(e) => {
          touchWasActive.current = e.pointerType === "touch" ? active : null
        }}
        onClick={onClick}
        className={[
          // Stacked (title over meta) until lg — at md widths the meta row is
          // wider than the viewport and would crush the title to zero width.
          "group flex flex-col gap-2 py-5 lg:flex-row lg:items-baseline lg:justify-between lg:gap-8 lg:py-6",
          "transition-opacity duration-300 outline-none",
          "focus-visible:opacity-100",
          !reducedMotion && dimmed ? "opacity-40" : "opacity-100"
        ].join(" ")}
      >
        <div className="flex min-w-0 items-baseline">
          <h3
            className={[
              "font-display uppercase leading-none tracking-tight text-[clamp(2.5rem,11vw,6rem)] transition-colors duration-300",
              active ? "neon-b" : "text-white group-hover:text-white"
            ].join(" ")}
          >
            <Decode>{project.title}</Decode>
          </h3>
        </div>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-[10px] md:text-xs font-mono tracking-[0.3em] uppercase text-white/60 lg:max-w-[50%] lg:justify-end">
          <span data-scramble data-text={project.role} className="whitespace-nowrap">
            {project.role}
          </span>
          {project.category && (
            <>
              <span className="text-white/20">/</span>
              <span data-scramble data-text={project.category} className="whitespace-nowrap">
                {project.category}
              </span>
            </>
          )}
          <span className="text-white/20">/</span>
          <span data-scramble data-text={project.year} className="text-[var(--color-accent-b)] whitespace-nowrap">
            {project.year}
          </span>
        </div>
      </Link>
    </li>
  )
}
