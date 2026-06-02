import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SidebarMenu from '../../../components/Sidebar/SidebarMenu';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../../i18n';

describe('SidebarMenu', () => {
  it('renders links and calls changeLanguage when buttons are clicked', () => {
    const changeLanguage = jest.fn();
    // Ensure i18n uses English so rendered link texts match expectations
    i18n.changeLanguage('en');

    render(
      <I18nextProvider i18n={i18n}>
        <SidebarMenu activeSection="Projects" changeLanguage={changeLanguage} />
      </I18nextProvider>
    );

  // Links - use role/name queries to avoid ambiguous matches (e.g. "Projects Documentation")
  expect(screen.getByRole('link', { name: /^projects$/i })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /about/i })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /experience/i })).toBeInTheDocument();

    // Language buttons
    const enBtn = screen.getByRole('button', { name: /switch to english/i });
    const deBtn = screen.getByRole('button', { name: /switch to german/i });

    fireEvent.click(enBtn);
    fireEvent.click(deBtn);

    expect(changeLanguage).toHaveBeenCalledWith('en');
    expect(changeLanguage).toHaveBeenCalledWith('de');
  });

  it('renders the German CV label and file when the active language is de', () => {
    const changeLanguage = jest.fn();
    i18n.changeLanguage('de');

    render(
      <I18nextProvider i18n={i18n}>
        <SidebarMenu activeSection="About" changeLanguage={changeLanguage} />
      </I18nextProvider>
    );

    expect(screen.getByRole('link', { name: /lebenslauf herunterladen/i })).toHaveAttribute(
      'href',
      '/Carlos_Keglevich_Lebenslauf_DE.pdf'
    );
  });

  it('evaluates the RepoDocs and Experience active branches', () => {
    const changeLanguage = jest.fn();
    i18n.changeLanguage('en');

    const { rerender } = render(
      <I18nextProvider i18n={i18n}>
        <SidebarMenu activeSection="RepoDocs" changeLanguage={changeLanguage} />
      </I18nextProvider>
    );

    expect(screen.getByRole('link', { name: /projects documentation/i })).toBeInTheDocument();

    rerender(
      <I18nextProvider i18n={i18n}>
        <SidebarMenu activeSection="Experience" changeLanguage={changeLanguage} />
      </I18nextProvider>
    );

    expect(screen.getByRole('link', { name: /job experiences/i })).toBeInTheDocument();
  });
});
