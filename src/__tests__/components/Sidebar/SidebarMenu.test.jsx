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
});
