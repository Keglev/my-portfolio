/**
 * @file ThemeContext.js
 * @module context/ThemeContext
 * @summary Provides light/dark theme state and a toggle to the component tree.
 * @enterprise Single source of truth for theme state, consumed by Sidebar
 * (toggle UI) and ProjectCard (theme-specific screenshot selection). Mirrors
 * state to the <html data-theme> attribute so index.css's CSS variable
 * overrides apply without prop-drilling into every styled component.
 * Persists the choice in localStorage; getInitialTheme() falls back to dark
 * (the site's default identity) if storage throws, which keeps SSR,
 * private-mode, and test environments working without a special case.
 * useTheme() works without a provider so isolated component tests don't
 * need to wrap in ThemeProvider.
 */
import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext({ theme: 'dark', toggleTheme: () => {} });

const STORAGE_KEY = 'portfolio-theme';

const getInitialTheme = () => {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch (e) { /* storage unavailable (SSR/tests/private mode) -- fall through */ }
  return 'dark';
};

/**
 * Provides the current theme and a toggle to the component tree, and keeps
 * the <html data-theme> attribute and localStorage in sync.
 *
 * @param {object} props
 * @param {React.ReactNode} props.children
 * @returns {JSX.Element}
 */
export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try { window.localStorage.setItem(STORAGE_KEY, theme); } catch (e) { /* ignore */ }
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * Access the active theme. Safe without a provider (defaults to dark),
 * which keeps isolated component tests simple.
 *
 * @returns {{theme: string, toggleTheme: Function}}
 */
export const useTheme = () => useContext(ThemeContext);

export default ThemeContext;
