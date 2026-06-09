// Verifies that SidebarMenu renders navigation links with correct labels, fires
// i18n.changeLanguage on language button clicks, and adapts the CV link and active
// section label to the current locale.
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SidebarMenu from '../../../components/Sidebar/SidebarMenu';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../../i18n';

describe('SidebarMenu', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders the navigation links with the correct labels', () => {
    i18n.changeLanguage('en');

    render(
      <I18nextProvider i18n={i18n}>
        <SidebarMenu activeSection="Projects" />
      </I18nextProvider>
    );

    // use role/name queries to avoid ambiguous matches (e.g. "Projects Documentation")
    expect(screen.getByRole('link', { name: /^projects$/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /about/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /experience/i })).toBeInTheDocument();
  });

  it('calls i18n.changeLanguage with the correct locale when a language button is clicked', () => {
    i18n.changeLanguage('en');
    const changeLanguageSpy = jest.spyOn(i18n, 'changeLanguage').mockImplementation(() => Promise.resolve());

    render(
      <I18nextProvider i18n={i18n}>
        <SidebarMenu activeSection="Projects" />
      </I18nextProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /switch to english/i }));
    fireEvent.click(screen.getByRole('button', { name: /switch to german/i }));

    expect(changeLanguageSpy).toHaveBeenCalledWith('en');
    expect(changeLanguageSpy).toHaveBeenCalledWith('de');
  });

  it('renders the German CV label and file when the active language is de', () => {
    i18n.changeLanguage('de');

    render(
      <I18nextProvider i18n={i18n}>
        <SidebarMenu activeSection="About" />
      </I18nextProvider>
    );

    expect(screen.getByRole('link', { name: /lebenslauf herunterladen/i })).toHaveAttribute(
      'href',
      '/Carlos_Keglevich_Lebenslauf_DE.pdf'
    );
  });

  it('renders the correct active link label for each recognized activeSection value', () => {
    i18n.changeLanguage('en');

    const { rerender } = render(
      <I18nextProvider i18n={i18n}>
        <SidebarMenu activeSection="RepoDocs" />
      </I18nextProvider>
    );

    expect(screen.getByRole('link', { name: /projects documentation/i })).toBeInTheDocument();

    rerender(
      <I18nextProvider i18n={i18n}>
        <SidebarMenu activeSection="Experience" />
      </I18nextProvider>
    );

    expect(screen.getByRole('link', { name: /job experiences/i })).toBeInTheDocument();
  });
});
