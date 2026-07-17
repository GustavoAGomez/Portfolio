import { useLocation } from "react-router-dom"
import { workIdFromPath } from "./activeSections"
import { PROJECTS, type Project } from "../config/projects"
import { getProjectContent, type ProjectContent } from "../config/projectContent"

export interface CurrentProject {
  id: string | null
  project: Project | undefined
  content: ProjectContent | undefined
}

/**
 * Resolves the project for the current `/work/:id` route. Uses `useLocation`
 * (not `useParams`) because the detail sections render inside the shell's <main>,
 * outside <Routes> — so they have no route-match context, only the URL.
 */
export function useCurrentProject(): CurrentProject {
  const { pathname } = useLocation()
  const id = workIdFromPath(pathname)
  const project = id ? PROJECTS.find((p) => p.id === id) : undefined
  return { id, project, content: getProjectContent(id) }
}
