import { create } from "zustand"
import { clamp01 } from "../lib/math"

export type SectionId = "hero" | "statement" | "works" | "gallery" | "about" | "footer"

export interface SectionBounds {
  /** Document-space top (px), independent of current scroll. */
  top: number
  height: number
}

/**
 * Live scroll values. This object identity is STABLE for the app lifetime and
 * its fields are mutated IN PLACE (never through `set`) by Lenis and the frame
 * loop. Consumers read it via `useStore.getState().scroll.*` inside useFrame /
 * rAF — so the ~60fps churn triggers ZERO React re-renders.
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
  registerSection: (id: SectionId, bounds: SectionBounds) => void
  unregisterSection: (id: SectionId) => void
  setReducedMotion: (v: boolean) => void
}

export const useStore = create<AppState>((set) => ({
  scroll: { scrollY: 0, limit: 0, progress: 0, rawVelocity: 0, velocity: 0 },
  sections: {},
  reducedMotion: false,
  registerSection: (id, bounds) => set((s) => ({ sections: { ...s.sections, [id]: bounds } })),
  unregisterSection: (id) =>
    set((s) => {
      const next = { ...s.sections }
      delete next[id]
      return { sections: next }
    }),
  setReducedMotion: (v) => set({ reducedMotion: v })
}))

/**
 * Local progress of a section (0 before it enters the viewport, 1 after it has
 * fully passed). Reads live scroll — call it inside a frame / rAF loop.
 */
export function getLocalProgress(id: SectionId, viewportHeight: number): number {
  const { scroll, sections } = useStore.getState()
  const b = sections[id]
  if (!b) return 0
  return clamp01((scroll.scrollY + viewportHeight - b.top) / (b.height + viewportHeight))
}
