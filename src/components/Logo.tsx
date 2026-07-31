import { useEffect, useState } from "react"
import { useLocation } from "react-router-dom"

/**
 * Brand mark: a rhombus split in the two palette accents, its halves displaced —
 * the site's own gem/refraction gesture. The offset lives in CSS (`.logo-half-*`)
 * so hover can widen it; `public/favicon.svg` bakes the same geometry.
 */
const RHOMBUS = "M32,5 L59,32 L32,59 L5,32 Z"

export function Logo({ size = 22, className = "" }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} aria-hidden="true" focusable="false">
      <defs>
        <clipPath id="logo-clip-l">
          <rect x="0" y="0" width="30.6" height="64" />
        </clipPath>
        <clipPath id="logo-clip-r">
          <rect x="33.4" y="0" width="30.6" height="64" />
        </clipPath>
      </defs>
      <g clipPath="url(#logo-clip-l)">
        <path className="logo-half-l" d={RHOMBUS} fill="var(--color-accent-b)" />
      </g>
      <g clipPath="url(#logo-clip-r)">
        <path className="logo-half-r" d={RHOMBUS} fill="var(--color-accent-a)" />
      </g>
    </svg>
  )
}

/** Fixed identity corner. Home only — every other route puts the ← Index chip
 *  in that same slot, so the corner always holds identity or the way back. It
 *  fades out past the hero as the language switch fades in (same threshold):
 *  the two corners hand over, and the mark never crowds the works-list header.
 *  The md offset mirrors the 1440px content cap, like the other fixed chrome. */
export function SiteLogo() {
  const isHome = useLocation().pathname === "/"
  const [atHero, setAtHero] = useState(true)

  useEffect(() => {
    if (!isHome) return
    const onScroll = () => setAtHero(window.scrollY < window.innerHeight * 0.5)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [isHome])

  if (!isHome) return null
  return (
    <div
      className={[
        "group fixed left-[max(1.5rem,env(safe-area-inset-left))] top-[max(1.5rem,env(safe-area-inset-top))] z-40 md:left-[max(4rem,calc((100vw_-_1440px)/2_+_4rem))] md:top-8",
        "transition-opacity duration-500",
        atHero ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      ].join(" ")}
    >
      <Logo size={26} />
    </div>
  )
}
