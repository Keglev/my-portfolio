/*
 * Tests for SidebarMenu.js
 * Covers: language button click behavior, CV link locale adaptation, and
 * active section link rendering across activeSection values.
 *
 * Real translation resolution of the dynamic NAV_ITEMS keys (t(key) where
 * key is a variable, not a literal in source) is covered separately in
 * SidebarMenu.i18n.test.js, which uses the real i18n instance instead of
 * this file's mock -- see that file's header for why.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SidebarMenu from '../../../components/Sidebar/SidebarMenu';

jest.mock('react-i18next', () => ({ useTranslation: jest.fn() }));
const { useTranslation } = require('react-i18next');

describe('SidebarMenu', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls i18n.changeLanguage with the correct locale when a language button is clicked', () => {
    const changeLanguage = jest.fn();
    useTranslation.mockReturnValue({ t: (k) => k, i18n: { language: 'en', changeLanguage } });

    render(<SidebarMenu activeSection="Projects" />);

    fireEvent.click(screen.getByRole('button', { name: /switch to english/i }));
    fireEvent.click(screen.getByRole('button', { name: /auf deutsch umschalten/i }));

    expect(changeLanguage).toHaveBeenCalledWith('en');
    expect(changeLanguage).toHaveBeenCalledWith('de');
  });

  it('renders the German CV label and file when the active language is de', () => {
    useTranslation.mockReturnValue({ t: (k) => k, i18n: { language: 'de', changeLanguage: jest.fn() } });

    render(<SidebarMenu activeSection="About" />);

    expect(screen.getByRole('link', { name: /lebenslauf herunterladen/i })).toHaveAttribute(
      'href',
      '/Carlos_Keglevich_Lebenslauf_DE.pdf'
    );
  });

  it('renders the nav link for each recognized activeSection value across rerenders', () => {
    useTranslation.mockReturnValue({ t: (k) => k, i18n: { language: 'en', changeLanguage: jest.fn() } });

    const { rerender } = render(<SidebarMenu activeSection="Skills" />);

    expect(screen.getByRole('link', { name: /^skills$/i })).toBeInTheDocument();

    rerender(<SidebarMenu activeSection="Contact" />);

    expect(screen.getByRole('link', { name: /^contact$/i })).toBeInTheDocument();
  });
});
