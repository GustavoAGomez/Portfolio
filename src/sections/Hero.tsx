import { useEffect, useRef } from "react"
import gsap from "gsap"

/**
 * Hero DOM: small semantic text only. The big GUSGQ headline is rendered in 3D
 * (canvas/modules/HeroScene) so the diamond can refract it — here it stays as an
 * sr-only <h1> for accessibility. This section still sets the hero scroll height.
 */
export function Hero() {
  const meta = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const ctx = gsap.context(() => {
      gsap.from(meta.current, { opacity: 0, y: 24, duration: 0.9, delay: 0.35, ease: "power2.out" })
    })
    return () => ctx.revert()
  }, [])

  return (
    <div className="relative min-h-screen flex flex-col justify-between px-6 md:px-16 py-16 pointer-events-none">
      <div ref={meta} className="max-w-xl">
        <p className="text-xs tracking-[0.35em] uppercase text-white/60">Creative Technologist — Portfolio</p>
      </div>

      <h1 className="sr-only">GUSGQ</h1>

      <div className="max-w-md">
        <div className="h-px w-40 bg-[var(--color-accent-a)]" />
        <p className="mt-6 text-white/70 text-sm md:text-base">
          It was the year 2076. <span className="neon-a font-semibold">The substance had arrived.</span>
        </p>
      </div>
    </div>
  )
}
