/**
 * @file index.js
 * @module src/index
 * @summary React app entry point: mounts App inside ErrorBoundary and
 * React.StrictMode onto the #root DOM node.
 * @enterprise ErrorBoundary wraps StrictMode (not the other way around) so
 * it catches crashes from StrictMode's dev-only double-invoked renders too,
 * not just from App's own render path.
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
