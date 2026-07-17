import { useCallback } from "react"
import { useStore, getLocalProgress, type SectionBounds, type SectionId } from "./store"

export interface SectionApi {
  /** Reactive bounds (re-renders the consumer only on mount / resize). */
  bounds: SectionBounds | undefined
  /** Live local progress 0..1 — call inside useFrame / rAF. */
  getProgress: () => number
  /** Live document-space center (px) of the section — for parallax anchoring. */
  getCenter: () => number
}

/**
 * Read a section's live scroll state. Scene modules consume `getProgress` /
 * `getCenter` inside their frame loop (no re-render per frame); `bounds` is the
 * only reactive slice and changes only on mount/resize.
 */
export function useSection(id: SectionId): SectionApi {
  const bounds = useStore((s) => s.sections[id])

  const getProgress = useCallback(() => getLocalProgress(id, window.innerHeight), [id])

  const getCenter = useCallback(() => {
    const b = useStore.getState().sections[id]
    return b ? b.top + b.height / 2 : 0
  }, [id])

  return { bounds, getProgress, getCenter }
}
