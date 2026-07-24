import { useEffect, useRef, useState } from "react"
import gsap from "gsap"
import { lenisRef } from "../scroll/useLenis"
import { Decode } from "../components/Decode"

/**
 * Hero DOM: small semantic text only. The big GUSGQ headline is rendered in 3D
 * (canvas/modules/HeroScene) so the diamond can refract it — here it stays as an
 * sr-only <h1> for accessibility. This section still sets the hero scroll height.
 */
export function Hero() {
  const meta = useRef<HTMLDivElement>(null)
  const [hasScrolled, setHasScrolled] = useState(false)

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const ctx = gsap.context(() => {
      // Slide only — NO opacity fade. A fade here would hide the <Decode> scramble
      // (it plays on landing, ~0.1–0.8s, i.e. while the container would still be
      // fading in), so the effect would never be seen.
      gsap.from(meta.current, { y: 24, duration: 0.9, delay: 0.1, ease: "power2.out" })
    })
    return () => ctx.revert()
  }, [])

  // Hide the scroll cue on the first scroll — one-way (never returns, even back at hero).
  useEffect(() => {
    let raf = 0
    let detach: (() => void) | null = null
    const trigger = () => {
      setHasScrolled(true)
      detach?.()
      detach = null
    }
    // Defer one frame so Lenis (created in the shell) is ready before we subscribe.
    const attach = () => {
      const lenis = lenisRef.current
      if (lenis) {
        detach = lenis.on("scroll", () => {
          if (lenis.scroll > 8) trigger()
        })
      } else {
        const onWin = () => {
          if (window.scrollY > 8) trigger()
        }
        window.addEventListener("scroll", onWin, { passive: true })
        detach = () => window.removeEventListener("scroll", onWin)
      }
    }
    raf = requestAnimationFrame(attach)
    return () => {
      cancelAnimationFrame(raf)
      detach?.()
    }
  }, [])

  return (
    <div className="relative min-h-svh flex flex-col justify-between px-6 md:px-16 py-16 pointer-events-none">
      <div ref={meta} className="max-w-xl">
        <p className="text-xs font-mono tracking-[0.35em] uppercase text-white/60">
          <Decode>Creative Technologist — Portfolio</Decode>
        </p>
      </div>

      <h1 className="sr-only">GUSGQ</h1>

      {/*<div className="max-w-md">
        <div className="h-px w-40 bg-[var(--color-accent-a)]" />
        <p className="mt-6 text-white/70 text-sm md:text-base">
          It was the year 2076. <span className="neon-a font-semibold">The substance had arrived.</span>
        </p>
      </div>*/}

      {/* Subtle scroll cue — bottom center; fades out on first scroll and never returns. */}
      <div
        aria-hidden="true"
        className={[
          "pointer-events-none absolute bottom-[max(2rem,env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 flex flex-col items-center gap-3",
          "transition-opacity duration-500",
          hasScrolled ? "opacity-0" : "opacity-100"
        ].join(" ")}
      >
        <span className="text-[10px] font-mono tracking-[0.35em] uppercase text-white/40">Scroll</span>
        <span className="relative block h-10 w-px bg-white/15">
          <span className="scroll-cue-dot absolute left-1/2 top-0 h-1.5 w-1.5 rounded-full bg-[var(--color-accent-b)]" />
        </span>
      </div>
    </div>
  )
}
