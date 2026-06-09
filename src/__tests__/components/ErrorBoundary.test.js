// Verifies that ErrorBoundary passes children through normally and catches render errors,
// displaying a fallback UI that includes the error message text.
import React from 'react';
import { render, screen } from '@testing-library/react';
import ErrorBoundary from '../../components/ErrorBoundary';

function Bomb() {
  throw new Error('boom');
}

describe('ErrorBoundary', () => {
  let consoleErrorSpy;

  beforeEach(() => {
    // Suppress React's uncaught error output; this test intentionally triggers render errors
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => consoleErrorSpy.mockRestore());

  it('renders children when nothing throws', () => {
    render(
      <ErrorBoundary>
        <div>safe child</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('safe child')).toBeInTheDocument();
  });

  it('renders a fallback when a child throws', () => {
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
