import { useEffect, useState } from "react"
import { useLocation } from "react-router-dom"
import { useStore, type Locale } from "../scroll/store"
import { captureSectionTops } from "../lib/sectionFlip"

/**
 * Language switch — fixed TOP-RIGHT chip, mirroring the ← Index chip top-left
 * (same blur-pill treatment and the same 1440px content-cap `right` calc).
 * Top-right is where users look for a language control (NN/g eye-tracking;
 * Smartling/Weglot best-practice guides), and it's the one corner this site
 * keeps free on every route. Text labels ("ES / EN"), not flags.
 *
 * The WHOLE chip is one TOGGLE button: a click flips to the other language
 * (the active one shows in lime; hovering lights up the one you'd switch to).
 * Switching locale re-keys every DOM section in SiteShell, so all <Decode>
 * texts replay the binary scramble toward the new language — the switch itself
 * triggers the site's decode transition.
 */
export function LangSwitch() {
  const locale = useStore((s) => s.locale)
  const setLocale = useStore((s) => s.setLocale)
  const next: Locale = locale === "es" ? "en" : "es"
  const { pathname } = useLocation()
  const isHome = pathname === "/"

  // On the HOME the chip belongs to the works view: hidden while the hero is on
  // screen, fading in once you scroll past half a viewport (the snap lands the
  // list at 1vh, so the threshold sits inside the transition) and back out if
  // you return to the hero. Every other route shows it from the start. Lenis
  // scrolls natively, so the window scroll event fires (same as WorksList).
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
        // Snapshot section positions BEFORE the remount, so SiteShell can FLIP
        // the layout shift (new text lengths) instead of letting it jump.
        captureSectionTops()
        setLocale(next)
      }}
      aria-label={next === "en" ? "Switch to English" : "Cambiar a español"}
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      // Same chip language as RouteBackButton; keep the two visually in sync.
      // Border stays dim white on hover (pill rule — vanishes inside the cursor
      // disc); the target language lights up lime via the group hover instead.
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
  // Active = lime. Inactive = dim, and it's the CLICK TARGET's preview: the
  // group hover lights it lime (hover-neon-b fires on .group:hover).
  return <span className={active ? "neon-b" : "text-white/60 hover-neon-b"}>{label}</span>
}
