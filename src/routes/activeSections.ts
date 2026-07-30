import { HOME_SECTIONS, DETAIL_SECTIONS, CASE_STUDY_SECTIONS, ABOUT_SECTIONS, NOT_FOUND_SECTIONS, type SectionConfig } from "../config/sections"
import { PROJECTS } from "../config/projects"
import { getProjectContent } from "../config/projectContent"

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
 * The URL is the single source of truth for which section set is live. Home →
 * HOME; /about → ABOUT; a valid `/work/:id` → CASE_STUDY (if it has content) or
 * DETAIL; ANYTHING else — an unknown path or an unknown /work id — is the 404
 * page. No redirect: the wrong URL stays in the bar and NOT_FOUND_SECTIONS
 * renders in place.
 */
export function activeSectionsFor(pathname: string): SectionConfig[] {
  if (pathname === "/") return HOME_SECTIONS
  if (/^\/about\/?$/.test(pathname)) return ABOUT_SECTIONS
  const id = workIdFromPath(pathname)
  if (id && isValidProject(id)) {
    // Projects with case-study content get the story layout; the rest stay generic.
    return getProjectContent(id) ? CASE_STUDY_SECTIONS : DETAIL_SECTIONS
  }
  return NOT_FOUND_SECTIONS
}
