/**
 * @file ThemeContext.test.js
 * @module src/__tests__/context/ThemeContext
 * @testing context/ThemeContext.js
 * @description Contract tests for the theme provider: it defaults to
 * dark and syncs the <html data-theme> attribute, toggles to light and
 * persists the choice to localStorage, restores a persisted theme on
 * mount, and falls back to dark when rendered without a provider.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, useTheme } from '../../context/ThemeContext';

const Probe = () => {
  const { theme, toggleTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <button onClick={toggleTheme}>toggle</button>
    </div>
  );
};

describe('ThemeContext', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('should default to dark and sync the data-theme attribute when no theme is persisted', () => {
    render(<ThemeProvider><Probe /></ThemeProvider>);

    expect(screen.getByTestId('theme')).toHaveTextContent('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('should toggle to light, update the attribute, and persist the choice when toggleTheme is called', () => {
    render(<ThemeProvider><Probe /></ThemeProvider>);

    fireEvent.click(screen.getByText('toggle'));

    expect(screen.getByTestId('theme')).toHaveTextContent('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(window.localStorage.getItem('portfolio-theme')).toBe('light');
  });

  it('should restore a persisted light theme when the provider mounts', () => {
    window.localStorage.setItem('portfolio-theme', 'light');

    render(<ThemeProvider><Probe /></ThemeProvider>);

    expect(screen.getByTestId('theme')).toHaveTextContent('light');
  });

  it('should fall back to dark when there is no provider', () => {
    render(<Probe />);

    expect(screen.getByTestId('theme')).toHaveTextContent('dark');
  });

  it('should return to dark when the visitor toggles the theme a second time', () => {
    // The toggle has to work in both directions, not just away from the
    // default -- a visitor who switches to light and back must land on the
    // same theme they started with.
    render(<ThemeProvider><Probe /></ThemeProvider>);

    fireEvent.click(screen.getByText('toggle'));
    fireEvent.click(screen.getByText('toggle'));

    expect(screen.getByTestId('theme')).toHaveTextContent('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(window.localStorage.getItem('portfolio-theme')).toBe('dark');
  });

  it('should ignore a persisted value that is not a known theme name', () => {
    // Guards against a stale or hand-edited storage entry rendering the site
    // with an undefined theme attribute.
    window.localStorage.setItem('portfolio-theme', 'solarized');

    render(<ThemeProvider><Probe /></ThemeProvider>);

    expect(screen.getByTestId('theme')).toHaveTextContent('dark');
  });

  it('should still render with the default theme when localStorage is unavailable', () => {
    // Private-browsing mode makes localStorage throw on access. The site must
    // still render rather than crash on mount.
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });

    render(<ThemeProvider><Probe /></ThemeProvider>);

    expect(screen.getByTestId('theme')).toHaveTextContent('dark');
    getItem.mockRestore();
  });

  it('should keep working when the theme choice cannot be persisted', () => {
    // Toggling must not be blocked by a storage write failure; the choice
    // simply does not survive a reload.
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    render(<ThemeProvider><Probe /></ThemeProvider>);
    fireEvent.click(screen.getByText('toggle'));

    expect(screen.getByTestId('theme')).toHaveTextContent('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    setItem.mockRestore();
  });
});
