import { useEffect, useState } from "react"
import { useLocation } from "react-router-dom"
import { useStore, type Locale } from "../scroll/store"
import { captureSectionTops } from "../lib/sectionFlip"

export function LangSwitch() {
  const locale = useStore((s) => s.locale)
  const setLocale = useStore((s) => s.setLocale)
  const next: Locale = locale === "es" ? "en" : "es"
  const { pathname } = useLocation()
  const isHome = pathname === "/"

  const [pastHero, setPastHero] = useState(false)
  useEffect(() => {
    if (!isHome) return
    const onScroll = () => setPastHero(window.scrollY > window.innerHeight * 0.5)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [isHome])
  const visible = !isHome || pastHero

  return (
    <button
      type="button"
      onClick={() => {
        // captureSectionTops must run BEFORE setLocale (SiteShell FLIPs the layout shift).
        captureSectionTops()
        setLocale(next)
      }}
      aria-label={next === "en" ? "Switch to English" : "Cambiar a español"}
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      // md `right` calc mirrors the 1440px content cap for fixed elements.
      className={[
        "group fixed right-[max(1.5rem,env(safe-area-inset-right))] top-[max(1.5rem,env(safe-area-inset-top))] z-40 flex items-center gap-2 rounded-full border border-white/15 bg-[var(--color-bg)]/40 backdrop-blur-md px-3.5 py-1.5 text-[10px] font-mono uppercase tracking-[0.35em] hover:border-white/30 md:right-[max(4rem,calc((100vw_-_1440px)/2_+_4rem))] md:top-8 md:text-xs",
        "transition-[opacity,border-color] duration-500",
        visible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      ].join(" ")}
    >
      <LangLabel label="ES" active={locale === "es"} />
      <span aria-hidden="true" className="text-white/25">
        /
      </span>
      <LangLabel label="EN" active={locale === "en"} />
    </button>
  )
}

function LangLabel({ label, active }: { label: string; active: boolean }) {
  return <span className={active ? "neon-b" : "text-white/60 hover-neon-b"}>{label}</span>
}
