/**
 * @file ErrorBoundary.js
 * @module components/ErrorBoundary/ErrorBoundary
 * @summary Catches unhandled React rendering errors and displays a
 * fallback UI instead of a blank page.
 * @enterprise Wraps App (see src/index.js) as the outermost boundary, so
 * it must render even if App itself -- including i18n init -- fails to
 * load. The fallback text is deliberately hardcoded in English rather than
 * routed through t(): if the crash is i18n-related, a translation call
 * inside the fallback UI could itself throw, defeating the boundary.
 */
import React from 'react';

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
