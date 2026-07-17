import { Component, type ErrorInfo, type ReactNode } from "react"

interface Props {
  children: ReactNode
}
interface State {
  failed: boolean
}

/**
 * Isolates the WebGL <Canvas>. If the GPU/context can't be created (locked-down
 * browser, driver failure, headless), the 3D layer is dropped and the semantic
 * DOM keeps working — instead of the whole app going blank.
 */
export class CanvasErrorBoundary extends Component<Props, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.warn("[canvas] WebGL layer disabled:", error.message, info.componentStack)
  }

  render(): ReactNode {
    if (this.state.failed) return null
    return this.props.children
  }
}
