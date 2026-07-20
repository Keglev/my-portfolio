/*
 * Real-i18n integration test for SidebarMenu.js.
 *
 * Every other SidebarMenu test mocks react-i18next (see SidebarMenu.test.js)
 * -- this file deliberately does not. SidebarMenu.js renders its nav labels
 * via t(key) where `key` comes from the NAV_ITEMS array, not a literal
 * string in source (unlike most other components, which call t('some.key')
 * directly). A mocked identity translation (t: (k) => k) would make a typo
 * in NAV_ITEMS or a missing key in en.json/de.json invisible: the mock
 * renders whatever string it's given regardless of whether that key
 * actually resolves in the real locale files. Only a test against the real
 * i18n instance can catch that class of bug, so this one case is kept as
 * a real integration test rather than converted to match the sibling mock
 * pattern.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import SidebarMenu from '../../../components/Sidebar/SidebarMenu';
import i18n from '../../../i18n';

describe('SidebarMenu (real i18n)', () => {
  it('renders the navigation links with their real translated labels', () => {
    i18n.changeLanguage('en');

    render(
      <I18nextProvider i18n={i18n}>
        <SidebarMenu activeSection="Projects" />
      </I18nextProvider>
    );

    // use role/name queries to avoid ambiguous matches (e.g. "Projects Documentation")
    expect(screen.getByRole('link', { name: /^projects$/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /about/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^contact$/i })).toBeInTheDocument();
  });
});
