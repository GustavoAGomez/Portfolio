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
      const rect = el.getBoundingClientRect()
      register(id, { top: rect.top + useStore.getState().scroll.scrollY, height: rect.height })
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
