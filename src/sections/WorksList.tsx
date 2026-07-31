import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type FocusEvent, type MouseEvent } from "react"
import { Link } from "react-router-dom"
import gsap from "gsap"
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin"
import { PROJECTS, type Project } from "../config/projects"
import { scrambleToReal } from "../lib/scramble"
import { useStore } from "../scroll/store"
import { useTransition } from "../transition/TransitionProvider"
import { CornerHud } from "../components/CornerHud"
import { Decode } from "../components/Decode"
import { useT } from "../i18n/ui"

gsap.registerPlugin(ScrambleTextPlugin)

interface RowRect {
  id: string
  top: number
  bottom: number
}

export function WorksList() {
  const reducedMotion = useStore((s) => s.reducedMotion)
  const t = useT()
  const [activeId, setActiveId] = useState<string | null>(null)

  const rowRefs = useRef<Record<string, HTMLAnchorElement | null>>({})
  const olRef = useRef<HTMLOListElement>(null)
  const rowRects = useRef<RowRect[]>([])
  const pointer = useRef<{ x: number; y: number } | null>(null)

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

  // La selección por posición se queda obsoleta al hacer scroll (no hay mousemove):
  // se reevalúa la última posición del ratón en cada scroll.
  useEffect(() => {
    const track = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return
      pointer.current = { x: e.clientX, y: e.clientY }
    }
    const onScroll = () => {
      const p = pointer.current
      const ol = olRef.current
      if (!p || !ol) return
      const r = ol.getBoundingClientRect()
      if (p.x < r.left || p.x > r.right || p.y < r.top || p.y >= r.bottom) {
        setActiveId(null)
        return
      }
      selectAt(p.y)
    }
    window.addEventListener("pointermove", track, { passive: true })
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      window.removeEventListener("pointermove", track)
      window.removeEventListener("scroll", onScroll)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleListBlur = (e: FocusEvent<HTMLOListElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setActiveId(null)
  }

  useEffect(() => {
    if (reducedMotion) return
    const rows = Object.values(rowRefs.current).filter((el): el is HTMLAnchorElement => el !== null)
    const activeEl = activeId ? rowRefs.current[activeId] ?? null : null
    if (!activeEl) return

    gsap.set(rows, { clearProps: "opacity" })
    const targets = activeEl.querySelectorAll<HTMLElement>("[data-scramble]")
    scrambleToReal(targets, 0.05)

    return () => {
      activeEl.querySelectorAll<HTMLElement>("[data-scramble]").forEach((s) => {
        gsap.getTweensOf(s).forEach((t) => t.progress(1).kill())
      })
      gsap.set(rows, { clearProps: "opacity" })
    }
  }, [activeId, reducedMotion])

  return (
    <div
      className="relative isolate min-h-svh w-full overflow-hidden pointer-events-auto"
      onPointerDown={(e) => {
        if (e.pointerType === "touch" && !olRef.current?.contains(e.target as Node)) setActiveId(null)
      }}
    >
      <div className="pointer-events-none absolute inset-0 z-0">
        {PROJECTS.map((p) => (
          <WorkBackdrop key={p.id} project={p} visible={activeId === p.id} reducedMotion={reducedMotion} />
        ))}
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

      <div className="content-max relative z-10 flex min-h-svh flex-col px-6 md:px-16 py-16">
        <header className="flex items-baseline justify-between">
          <p className="text-xs font-mono tracking-[0.35em] uppercase text-white/60">
            <Decode>{t.selectedWork}</Decode>
          </p>
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

function WorkBackdrop({ project, visible, reducedMotion }: WorkBackdropProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const useVideo = !!project.hoverVideo && !reducedMotion

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    if (visible) void v.play().catch(() => {})
    else v.pause()
  }, [visible])

  const style: CSSProperties = {
    filter: "grayscale(1) contrast(1.15) brightness(0.6)",
    opacity: visible ? 1 : 0,
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
  const locale = useStore((s) => s.locale)
  const role = project.role[locale]
  const category = project.category?.[locale]
  const to = `/work/${project.id}`
  const rowRef = useRef<HTMLAnchorElement | null>(null)

  useEffect(() => {
    const el = rowRef.current
    if (!el || reducedMotion) return
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (!entry?.isIntersecting) return
        io.disconnect()
        scrambleToReal(el.querySelectorAll<HTMLElement>("[data-scramble]"), 0.06)
      },
      { threshold: 0.6 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [reducedMotion])

  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
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
        aria-label={`${project.title} — ${role}, ${project.year}`}
        // Touch activation is focus-based, NOT pointerdown (pointerdown also fires
        // when a finger lands on a row just to scroll).
        onFocus={onActivate}
        onClick={onClick}
        className={[
          "group flex flex-col gap-2 py-5 lg:flex-row lg:items-baseline lg:justify-between lg:gap-8 lg:py-6",
          "transition-opacity duration-300 outline-none",
          "focus-visible:opacity-100",
          !reducedMotion && dimmed ? "opacity-40" : "opacity-100"
        ].join(" ")}
      >
        <div className="flex min-w-0 items-baseline">
          <h3
            className={[
              "font-display uppercase leading-none tracking-tight text-[clamp(2.5rem,11vw,6rem)] transition-colors duration-300 hover-neon-b",
              active ? "neon-b" : "text-white"
            ].join(" ")}
          >
            <Decode>{project.title}</Decode>
          </h3>
        </div>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-[10px] md:text-xs font-mono tracking-[0.3em] uppercase text-white/60 transition-colors duration-300 group-hover:text-[var(--color-accent-b)] group-focus-visible:text-[var(--color-accent-b)] lg:max-w-[50%] lg:justify-end">
          <span data-scramble data-text={role} className="whitespace-nowrap">
            {role}
          </span>
          {category && (
            <>
              <span className="opacity-30">/</span>
              <span data-scramble data-text={category} className="whitespace-nowrap">
                {category}
              </span>
            </>
          )}
          <span className="opacity-30">/</span>
          <span data-scramble data-text={project.year} className="text-[var(--color-accent-b)] whitespace-nowrap">
            {project.year}
          </span>
        </div>
      </Link>
    </li>
  )
}
