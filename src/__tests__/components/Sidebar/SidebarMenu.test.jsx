/**
 * @file SidebarMenu.test.js
 * @module src/__tests__/components/Sidebar/SidebarMenu
 * @testing components/Sidebar/SidebarMenu.js
 * @description Contract tests for the sidebar menu: language-button click
 * behavior, the German CV link/label swap, and nav-link rendering across
 * activeSection values.
 *
 * Out of scope: real translation resolution of the dynamic NAV_ITEMS keys
 * (t(key) where key is a variable, not a literal in source) -- covered
 * separately in SidebarMenu.i18n.test.js, which uses the real i18n
 * instance instead of this file's mock. See that file's header for why.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SidebarMenu from '../../../components/Sidebar/SidebarMenu';
import { ThemeProvider } from '../../../context/ThemeContext';

vi.mock('react-scroll');
vi.mock('react-i18next', () => ({ useTranslation: vi.fn() }));
import { useTranslation } from 'react-i18next';

describe('SidebarMenu', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should call i18n.changeLanguage with the correct locale when a language button is clicked', () => {
    const changeLanguage = vi.fn();
    useTranslation.mockReturnValue({ t: (k) => k, i18n: { language: 'en', changeLanguage } });

    render(<SidebarMenu activeSection="Projects" />);

    fireEvent.click(screen.getByRole('button', { name: /switch to english/i }));
    fireEvent.click(screen.getByRole('button', { name: /auf deutsch umschalten/i }));

    expect(changeLanguage).toHaveBeenCalledWith('en');
    expect(changeLanguage).toHaveBeenCalledWith('de');
  });

  it('should render the German CV label and file when the active language is de', () => {
    useTranslation.mockReturnValue({ t: (k) => k, i18n: { language: 'de', changeLanguage: vi.fn() } });

    render(<SidebarMenu activeSection="About" />);

    expect(screen.getByRole('link', { name: /lebenslauf herunterladen/i })).toHaveAttribute(
      'href',
      '/Carlos_Keglevich_Lebenslauf_DE.pdf'
    );
  });

  it('should render the nav link for each recognized activeSection value when activeSection changes across rerenders', () => {
    useTranslation.mockReturnValue({ t: (k) => k, i18n: { language: 'en', changeLanguage: vi.fn() } });

    const { rerender } = render(<SidebarMenu activeSection="Skills" />);

    expect(screen.getByRole('link', { name: /^skills$/i })).toBeInTheDocument();

    rerender(<SidebarMenu activeSection="Contact" />);

    expect(screen.getByRole('link', { name: /^contact$/i })).toBeInTheDocument();
  });

  describe('theme switch', () => {
    // The button is a toggle whose label, tooltip, and glyph must all describe
    // the theme it will switch TO, not the one currently active. Getting that
    // backwards is invisible in a screenshot but tells a screen-reader user
    // the opposite of what the button does.
    beforeEach(() => {
      useTranslation.mockReturnValue({
        t: (k, def) => def || k,
        i18n: { language: 'en', changeLanguage: vi.fn() },
      });
      window.localStorage.clear();
      document.documentElement.removeAttribute('data-theme');
    });

    it('should offer to switch to the light theme while the dark theme is active', () => {
      render(
        <ThemeProvider>
          <SidebarMenu activeSection="About" />
        </ThemeProvider>
      );

      const button = screen.getByRole('button', { name: 'Switch to light theme' });

      expect(button).toHaveAttribute('title', 'Light theme');
      expect(button).toHaveTextContent('☀');
    });

    it('should offer to switch back to the dark theme once the light theme is active', () => {
      window.localStorage.setItem('portfolio-theme', 'light');

      render(
        <ThemeProvider>
          <SidebarMenu activeSection="About" />
        </ThemeProvider>
      );

      const button = screen.getByRole('button', { name: 'Switch to dark theme' });

      expect(button).toHaveAttribute('title', 'Dark theme');
      expect(button).toHaveTextContent('☾');
    });

    it('should switch the theme when the visitor clicks the toggle', () => {
      render(
        <ThemeProvider>
          <SidebarMenu activeSection="About" />
        </ThemeProvider>
      );

      fireEvent.click(screen.getByRole('button', { name: 'Switch to light theme' }));

      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
      expect(screen.getByRole('button', { name: 'Switch to dark theme' })).toBeInTheDocument();
    });
  });
});
