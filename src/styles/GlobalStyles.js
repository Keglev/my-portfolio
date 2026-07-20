/**
 * @file GlobalStyles.js
 * @module styles/GlobalStyles
 * @summary CSS reset and base typography applied globally via styled-components.
 * @enterprise Injected once at the root (see App.js) so every component
 * inherits consistent defaults without re-declaring its own box-sizing and
 * margin resets. Color values reference CSS custom properties (--color-bg,
 * --color-text) rather than literals so ThemeContext's <html data-theme>
 * toggle recolors the whole app without this file needing to know about
 * themes at all.
 */
import { createGlobalStyle } from 'styled-components';

export const GlobalStyles = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: 'Montserrat', sans-serif;
    background-color: var(--color-bg);
    color: var(--color-text);
    scroll-behavior: smooth;
    line-height: 1.6;
  }

  h1, h2, h3, h4, h5, h6 {
    margin: 0;
    font-weight: 700;
  }

  p {
    margin: 0;
  }

  @media (max-width: 768px) {
    body {
      padding: 0 1rem;
    }
  }
`;
