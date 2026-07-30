import { useStore, type Locale } from "../scroll/store"

const LOCALES: Locale[] = ["es", "en"]

/**
 * Language switch — fixed TOP-RIGHT chip, mirroring the ← Index chip top-left
 * (same blur-pill treatment and the same 1440px content-cap `right` calc).
 * Top-right is where users look for a language control (NN/g eye-tracking;
 * Smartling/Weglot best-practice guides), and it's the one corner this site
 * keeps free on every route. Text labels ("ES / EN"), not flags.
 *
 * Switching locale re-keys every DOM section in SiteShell, so all <Decode>
 * texts replay the binary scramble toward the new language — the switch itself
 * triggers the site's decode transition.
 */
export function LangSwitch() {
  const locale = useStore((s) => s.locale)
  const setLocale = useStore((s) => s.setLocale)

  return (
    <div
      // Same chip language as RouteBackButton; keep the two visually in sync.
      className="fixed right-[max(1.5rem,env(safe-area-inset-right))] top-[max(1.5rem,env(safe-area-inset-top))] z-40 pointer-events-auto flex items-center gap-2 rounded-full border border-white/15 bg-[var(--color-bg)]/40 backdrop-blur-md px-3.5 py-1.5 text-[10px] font-mono uppercase tracking-[0.35em] transition-colors hover:border-white/30 md:right-[max(4rem,calc((100vw_-_1440px)/2_+_4rem))] md:top-8 md:text-xs"
    >
      {LOCALES.map((l, i) => (
        <span key={l} className="flex items-center gap-2">
          {i > 0 && (
            <span aria-hidden="true" className="text-white/25">
              /
            </span>
          )}
          <button
            type="button"
            onClick={() => setLocale(l)}
            aria-pressed={locale === l}
            aria-label={l === "es" ? "Español" : "English"}
            className={locale === l ? "neon-b" : "text-white/60 hover-neon-b"}
          >
            {l.toUpperCase()}
          </button>
        </span>
      ))}
    </div>
  )
}
