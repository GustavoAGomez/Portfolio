import { useCallback } from "react"
import { useStore, type SectionBounds, type SectionId } from "./store"

export interface SectionApi {
  /** Reactive bounds (re-renders the consumer only on mount / resize). */
  bounds: SectionBounds | undefined
  /** Live document-space center (px) — call inside useFrame / rAF. */
  getCenter: () => number
}

export function useSection(id: SectionId): SectionApi {
  const bounds = useStore((s) => s.sections[id])

  const getCenter = useCallback(() => {
    const b = useStore.getState().sections[id]
    return b ? b.top + b.height / 2 : 0
  }, [id])

  return { bounds, getCenter }
}
