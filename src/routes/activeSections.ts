import { HOME_SECTIONS, DETAIL_SECTIONS, CASE_STUDY_SECTIONS, ABOUT_SECTIONS, LEGAL_SECTIONS, NOT_FOUND_SECTIONS, type SectionConfig } from "../config/sections"
import { PROJECTS } from "../config/projects"
import { getProjectContent } from "../config/projectContent"

const WORK_RE = /^\/work\/([^/]+)\/?$/

export function workIdFromPath(pathname: string): string | null {
  const m = pathname.match(WORK_RE)
  return m ? (m[1] ?? null) : null
}

export function isValidProject(id: string | null | undefined): boolean {
  return id != null && PROJECTS.some((p) => p.id === id)
}

export function activeSectionsFor(pathname: string): SectionConfig[] {
  if (pathname === "/") return HOME_SECTIONS
  if (/^\/about\/?$/.test(pathname)) return ABOUT_SECTIONS
  if (/^\/legal\/?$/.test(pathname)) return LEGAL_SECTIONS
  const id = workIdFromPath(pathname)
  if (id && isValidProject(id)) {
    return getProjectContent(id) ? CASE_STUDY_SECTIONS : DETAIL_SECTIONS
  }
  return NOT_FOUND_SECTIONS
}
