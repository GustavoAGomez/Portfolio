import { Component, type ErrorInfo, type ReactNode } from "react"

interface Props {
  children: ReactNode
}
interface State {
  failed: boolean
}

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
