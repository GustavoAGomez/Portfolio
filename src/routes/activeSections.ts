import { HOME_SECTIONS, DETAIL_SECTIONS, type SectionConfig } from "../config/sections"
import { PROJECTS } from "../config/projects"

const WORK_RE = /^\/work\/([^/]+)\/?$/

/** Extract a `/work/:id` id from a pathname (null if not a work route). */
export function workIdFromPath(pathname: string): string | null {
  const m = pathname.match(WORK_RE)
  return m ? (m[1] ?? null) : null
}

export function isValidProject(id: string | null | undefined): boolean {
  return id != null && PROJECTS.some((p) => p.id === id)
}

/**
 * The URL is the single source of truth for which section set is live. A valid
 * `/work/:id` → DETAIL; everything else (home, invalid id, unknown) → HOME.
 * Invalid ids fall back to HOME here so there's no DETAIL flash before the
 * route's <Navigate> redirect lands.
 */
export function activeSectionsFor(pathname: string): SectionConfig[] {
  const id = workIdFromPath(pathname)
  return id && isValidProject(id) ? DETAIL_SECTIONS : HOME_SECTIONS
}
