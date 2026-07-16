import React, { createContext, useContext, useEffect, useState } from 'react';

/**
 * Theme context for light/dark mode.
 *
 * The active theme is exposed to components (e.g. ProjectCard picks
 * theme-specific screenshots) and mirrored to a `data-theme` attribute on
 * <html>, which drives the CSS variable overrides in index.css. The choice
 * persists in localStorage; the default is dark, matching the site's identity.
 */
const ThemeContext = createContext({ theme: 'dark', toggleTheme: () => {} });

const STORAGE_KEY = 'portfolio-theme';

const getInitialTheme = () => {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch (e) { /* storage unavailable (SSR/tests/private mode) — fall through */ }
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
