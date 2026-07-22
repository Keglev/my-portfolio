/**
 * @file ErrorBoundary.test.js
 * @module src/__tests__/components/ErrorBoundary
 * @testing components/ErrorBoundary/ErrorBoundary.js
 * @description Contract tests for the error boundary: normal child
 * rendering passes through unchanged, and a render error is caught and
 * replaced with the fallback UI (error message + logged console.error).
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import ErrorBoundary from '../../components/ErrorBoundary/ErrorBoundary';

function Bomb() {
  throw new Error('boom');
}

describe('ErrorBoundary', () => {
  let consoleErrorSpy;

  beforeEach(() => {
    // Suppress React's uncaught error output; this test intentionally triggers render errors
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => consoleErrorSpy.mockRestore());

  it('should render children when nothing throws', () => {
    render(
      <ErrorBoundary>
        <div>safe child</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('safe child')).toBeInTheDocument();
  });

  it('should render a fallback when a child throws', () => {
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong while rendering the app.')).toBeInTheDocument();
    expect(screen.getByText(/Error: boom/)).toBeInTheDocument();
    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});
