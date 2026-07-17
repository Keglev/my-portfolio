import styled from 'styled-components';
import { Link } from 'react-scroll';

/**
 * Fixed full-height column that holds all sidebar content.
 * Becomes a static block on mobile so it doesn't obscure the scrollable content area.
 */
export const SidebarContainer = styled.div`
  width: 280px;
  height: 100vh;
  background-color: var(--color-bg);
  color: var(--color-text);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  position: fixed;
  top: 0;
  left: 0;
  padding: 1rem 1rem;
  overflow: hidden;
  box-sizing: border-box;

  @media (max-width: 768px) {
    width: 100%;
    height: auto;
    position: relative;
    overflow-y: visible;
  }
`;

/**
 * Navigation link powered by react-scroll.
 * Slides right on hover/active to signal the current section without a full page change.
 */
export const StyledLink = styled(Link)`
  display: flex;
  align-items: center;
  color: var(--color-text);
  font-size: 1.4rem;
  cursor: pointer;
  text-decoration: none;
  transition: transform 0.3s ease, color 0.3s ease;

  &:hover,
  &.active {
    transform: translateX(10px);
    color: var(--color-accent);
  }
`;

/**
 * Name and job title block at the top of the sidebar.
 * Uses clamp() on h1 so the name stays on one line within the fixed sidebar width.
 */
export const NameTitle = styled.div`
  text-align: center;

  h1 {
    /* clamp keeps the name on one line without overflowing the fixed sidebar width */
    font-size: clamp(1.4rem, 4.8vw, 1.9rem);
    margin-bottom: 0.3rem;
    color: var(--color-accent);
    white-space: nowrap;
  }

  h2 {
    font-size: 1.1rem;
    color: var(--color-text-muted);
  }

  @media (max-width: 768px) {
    h1 {
      font-size: 1.6rem;
      white-space: normal;
    }

    h2 {
      font-size: 1rem;
    }
  }
`;

/**
 * Navigation link column. Hidden on mobile because the sidebar
 * collapses to a top header bar where vertical links don't fit.
 */
export const Menu = styled.div`
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1.2rem;

  @media (max-width: 768px) {
    display: none;
  }
`;

/**
 * Footer area at the bottom of the sidebar containing the tagline and legal links.
 */
export const FooterMessage = styled.div`
  margin-bottom: 0;
  text-align: center;
  font-size: 0.9rem;
  color: var(--color-text);

  p {
    margin: 0;
  }

  .footer-name {
    font-weight: 600;
    margin-top: 0.15rem;
  }

  @media (max-width: 768px) {
    font-size: 0.8rem;
  }
`;

/**
 * Language toggle button group. Subtle background separates it visually
 * from the navigation links above.
 */
export const LanguageWrapper = styled.div`
  margin-bottom: 1rem;
  display: flex;
  gap: 1.5rem;
  margin-top: 1rem;
  button {
    background: transparent;
    color: var(--color-text);
    border: 1px solid rgba(100,255,218,0.16);
    padding: 0.5rem 0.8rem;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
    box-shadow: 0 2px 6px rgba(10,25,47,0.25);
    transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease, transform 0.08s ease, box-shadow 0.12s ease;
  }
  /* Hover never touches background — only border/color — so it can never land
     on the same color as the (possibly accent) background underneath it */
  button:hover {
    border-color: var(--color-accent);
    color: var(--color-accent);
    transform: translateY(-3px) scale(1.06);
  }
  /* Active language is always readable: solid accent background paired with
     the accent-contrast text color, driven by the aria attribute (not inline styles) */
  button[aria-pressed='true'] {
    background: var(--color-accent);
    color: var(--color-accent-contrast);
    font-weight: 700;
  }
  /* Slight border to visually separate language buttons from the rest of the footer */
  & {
    padding: 0.6rem 0.8rem;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.02);
    background: linear-gradient(180deg, rgba(255,255,255,0.01), rgba(0,0,0,0.02));
  }
`;

/**
 * Ghost button used for Impressum and Datenschutz footer links.
 * Styled to look like a text link while keeping button semantics for accessibility.
 */
export const LegalButton = styled.button`
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  color: inherit;
  text-decoration: underline;
  font: inherit;
`;

/**
 * Centering wrapper for the CV download link.
 */
export const CVDownloadWrapper = styled.div`
  margin-top: 1rem;
  margin-bottom: 0;
  display: flex;
  justify-content: center;
`;

/**
 * Styled CV download link. Matches the language button appearance
 * so both actions feel like peers in the sidebar footer.
 */
export const CVDownloadLink = styled.a`
  display: inline-block;
  background: rgba(100, 255, 218, 0.04);
  border: 1px solid rgba(100, 255, 218, 0.16);
  color: var(--color-accent);
  padding: 0.5rem 0.8rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 1rem;
  text-decoration: none;
  box-shadow: 0 2px 6px rgba(10, 25, 47, 0.25);
  transition: background 0.15s ease, color 0.15s ease, transform 0.08s ease,
    box-shadow 0.12s ease;

  &:hover {
    background: var(--color-accent);
    color: var(--color-accent-contrast);
    transform: translateY(-3px) scale(1.06);
    box-shadow: 0 8px 18px rgba(100, 255, 218, 0.14);
  }
`;
