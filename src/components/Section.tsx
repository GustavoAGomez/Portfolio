import { useLayoutEffect, useRef, type ReactNode } from "react"
import { useStore, type SectionId } from "../scroll/store"
import { debounce } from "../lib/math"

interface SectionProps {
  id: SectionId
  anchor?: boolean
  className?: string
  children?: ReactNode
}

/**
 * Semantic DOM wrapper that measures its own rect and registers document-space
 * bounds in the store. WebGL modules read those bounds (via useSection) to place
 * and parallax their content. Re-measures on resize / content changes so any
 * subset of enabled sections stays consistent.
 */
export function Section({ id, anchor, className, children }: SectionProps) {
  const ref = useRef<HTMLElement>(null)
  const register = useStore((s) => s.registerSection)
  const unregister = useStore((s) => s.unregisterSection)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return

    const measure = () => {
      // The debounced call can fire AFTER this section unmounted (its timeout
      // survives the cleanup — with rapid language switches a section lives
      // < 150ms): the detached element measures a ZERO rect and would register
      // top = 0 + scrollY, CLOBBERING the new section's correct bounds. That
      // corrupt top made the case-study gem's shrinkPastHero latch read "hero
      // not passed" and the diamond flashed mid-page. Same guard covers a
      // Suspense-hidden (display:none) element, which also measures zero.
      if (!el.isConnected) return
      const rect = el.getBoundingClientRect()
      if (rect.height === 0) return
      // window.scrollY, not store.scroll.scrollY: rect.top comes from the DOM,
      // so the scroll added back must be the DOM's too — the sum is the
      // document-space top exactly, even if Lenis and the browser diverge for
      // an instant during the switch remount.
      register(id, { top: rect.top + window.scrollY, height: rect.height })
    }
    measure()

    const debounced = debounce(measure, 150)
    const ro = new ResizeObserver(debounced)
    ro.observe(el)
    window.addEventListener("resize", debounced)
    window.addEventListener("load", measure)

    return () => {
      ro.disconnect()
      window.removeEventListener("resize", debounced)
      window.removeEventListener("load", measure)
      unregister(id)
    }
  }, [id, register, unregister])

  return (
    <section ref={ref} data-section={id} data-anchor={anchor ? "" : undefined} className={className}>
      {children}
    </section>
  )
}
