import { useLayoutEffect, useRef, type ReactNode } from "react"
import { useStore, type SectionId } from "../scroll/store"
import { debounce } from "../lib/math"

interface SectionProps {
  id: SectionId
  anchor?: boolean
  className?: string
  children?: ReactNode
}

export function Section({ id, anchor, className, children }: SectionProps) {
  const ref = useRef<HTMLElement>(null)
  const register = useStore((s) => s.registerSection)
  const unregister = useStore((s) => s.unregisterSection)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return

    const measure = () => {
      // A stale debounced measure can fire after unmount (or on a display:none
      // element): the zero rect would clobber the new section's correct bounds.
      if (!el.isConnected) return
      const rect = el.getBoundingClientRect()
      if (rect.height === 0) return
      // window.scrollY, not store.scroll.scrollY — the scroll added back must
      // come from the same source as rect.top (the DOM).
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
