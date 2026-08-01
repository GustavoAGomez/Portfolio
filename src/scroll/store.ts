import { create } from "zustand"

export type SectionId = "hero" | "statement" | "description" | "story" | "works" | "gallery" | "about" | "profile" | "footer" | "legal" | "notFound"

/** Site locale. Spanish is the source copy; English is the translation. */
export type Locale = "es" | "en"

const LOCALE_KEY = "locale"

function initialLocale(): Locale {
  try {
    return localStorage.getItem(LOCALE_KEY) === "en" ? "en" : "es"
  } catch {
    return "es"
  }
}

export interface SectionBounds {
  /** Document-space top (px), independent of current scroll. */
  top: number
  height: number
}

/**
 * Live scroll values — a stable object mutated IN PLACE (never via `set`), so 60fps
 * churn triggers ZERO re-renders. Read via getState().scroll.* in useFrame/rAF.
 */
export interface ScrollLive {
  scrollY: number
  limit: number
  /** Global progress 0..1. */
  progress: number
  /** Normalized, signed instantaneous velocity written by Lenis. */
  rawVelocity: number
  /** Damped velocity (ScrollBridge lerps this toward rawVelocity each frame). */
  velocity: number
}

interface AppState {
  scroll: ScrollLive
  /** Reactive: section bounds, updated rarely (mount / resize). */
  sections: Partial<Record<SectionId, SectionBounds>>
  /** Reactive: honored across parallax, velocity and reveals. */
  reducedMotion: boolean
  /** Active case-study id, set by SiteShell from the URL (the Canvas has no Router context). */
  caseStudyId: string | null
  /** Measured document-space centers of the story blocks' media slots (Story.tsx). */
  storyAnchors: number[]
  /** Measured document-space centers of the About page's media slots (Profile.tsx). */
  profileAnchors: number[]
  /** Persisted UI language; switching re-keys sections so every <Decode> replays. */
  locale: Locale
  registerSection: (id: SectionId, bounds: SectionBounds) => void
  unregisterSection: (id: SectionId) => void
  setReducedMotion: (v: boolean) => void
  setCaseStudyId: (id: string | null) => void
  setStoryAnchors: (centers: number[]) => void
  setProfileAnchors: (centers: number[]) => void
  setLocale: (l: Locale) => void
}

export const useStore = create<AppState>((set) => ({
  scroll: { scrollY: 0, limit: 0, progress: 0, rawVelocity: 0, velocity: 0 },
  sections: {},
  reducedMotion: false,
  caseStudyId: null,
  registerSection: (id, bounds) => set((s) => ({ sections: { ...s.sections, [id]: bounds } })),
  unregisterSection: (id) =>
    set((s) => {
      const next = { ...s.sections }
      delete next[id]
      return { sections: next }
    }),
  storyAnchors: [],
  profileAnchors: [],
  locale: initialLocale(),
  setReducedMotion: (v) => set({ reducedMotion: v }),
  setCaseStudyId: (id) => set((s) => (s.caseStudyId === id ? s : { caseStudyId: id })),
  setStoryAnchors: (centers) => set({ storyAnchors: centers }),
  setProfileAnchors: (centers) => set({ profileAnchors: centers }),
  setLocale: (l) =>
    set(() => {
      try {
        localStorage.setItem(LOCALE_KEY, l)
      } catch {
        /* private mode — the choice just won't persist */
      }
      return { locale: l }
    })
}))
