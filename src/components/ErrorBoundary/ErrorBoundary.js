import React from 'react';

/**
 * Catches unhandled React rendering errors and displays a fallback UI
 * instead of a blank page. Wrap any subtree that may throw during render.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught an error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, color: '#ffcccb', background: '#0a0a0a' }}>
          <h2>Something went wrong while rendering the app.</h2>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{String(this.state.error)}</pre>
        </div>
      );
    }

    return this.props.children;
  }
}
