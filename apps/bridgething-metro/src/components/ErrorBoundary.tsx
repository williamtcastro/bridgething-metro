import { Component, type ReactNode } from 'react';

// a render crash would otherwise leave a black screen with no way home: show it, then reload
export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error('[metro] crashed', error);
    window.setTimeout(() => location.reload(), 5000);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="crash">
        <span className="crash-title">something went wrong</span>
        <span>{this.state.error.message}</span>
        <span>restarting in 5 seconds</span>
      </div>
    );
  }
}
