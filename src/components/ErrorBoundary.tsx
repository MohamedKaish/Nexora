'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from '@/components/ui/button'

interface Props {
  children?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-8 bg-red-950/20 border border-red-500/50 rounded-xl my-8">
          <h2 className="text-xl font-bold text-red-500 mb-2">Focus Mode Crashed</h2>
          <p className="text-red-400 font-mono text-sm break-words max-w-2xl mb-4">
            {this.state.error?.message || 'Unknown error'}
          </p>
          <div className="bg-black/50 p-4 rounded-lg w-full max-w-2xl overflow-auto text-xs text-red-300/70 font-mono mb-4 whitespace-pre-wrap">
            {this.state.error?.stack}
          </div>
          <Button
            variant="outline"
            onClick={() => {
              this.setState({ hasError: false, error: null })
              // also clear local storage just in case it's corrupted state
              try {
                localStorage.removeItem('nexora-focus-storage')
                window.location.reload()
              } catch(e) {}
            }}
            className="border-red-500/50 text-red-400 hover:bg-red-950"
          >
            Clear State & Reload
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}
