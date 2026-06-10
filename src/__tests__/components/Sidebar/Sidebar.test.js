/*
 * Tests for Sidebar.js
 * Covers: scroll position tracking, active section updates, scroll listener cleanup on unmount,
 * and scrollIntoView calls for legal subsection buttons.
 */
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Sidebar from '../../../components/Sidebar/Sidebar';

jest.mock('react-i18next', () => ({ useTranslation: jest.fn() }));
const { useTranslation } = require('react-i18next');

// Sidebar passes only activeSection to SidebarMenu — no changeLanguage prop
jest.mock('../../../components/Sidebar/SidebarMenu', () => ({
  __esModule: true,
  default: ({ activeSection }) => (
    <div data-testid="sidebar-menu">
      <span data-testid="active-section">{activeSection}</span>
    </div>
  ),
}));

jest.mock('../../../components/Sidebar/SidebarSocial', () => ({
  __esModule: true,
  default: () => <div data-testid="sidebar-social" />,
}));

describe('Sidebar', () => {
  let originalInnerHeight;
  let originalOffsetTop;
  let originalScrollIntoView;

  const renderWithSections = () => render(
    <>
      <Sidebar />
      <div id="About" data-offset-top="0" />
      <div id="Education" data-offset-top="100" />
      <div id="Projects" data-offset-top="200" />
      <div id="Experience" data-offset-top="300" />
      <div id="RepoDocs" data-offset-top="400" />
      <div id="Legal" data-offset-top="500" />
      <div id="Impressum" />
      <div id="Datenschutz" />
    </>
  );

  function patchDomProperties() {
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 100 });
    Object.defineProperty(window, 'scrollY', { configurable: true, writable: true, value: 0 });
    Object.defineProperty(HTMLElement.prototype, 'offsetTop', {
      configurable: true,
      get() {
        const offset = this.getAttribute('data-offset-top');
        return offset ? Number(offset) : 0;
      },
    });
    HTMLElement.prototype.scrollIntoView = jest.fn();
  }

  beforeEach(() => {
    jest.clearAllMocks();
    useTranslation.mockReturnValue({ t: (k) => k });
    originalInnerHeight = window.innerHeight;
    originalOffsetTop = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetTop');
    originalScrollIntoView = HTMLElement.prototype.scrollIntoView;
    patchDomProperties();
  });

  afterEach(() => {
    if (originalOffsetTop) {
      Object.defineProperty(HTMLElement.prototype, 'offsetTop', originalOffsetTop);
    }
    HTMLElement.prototype.scrollIntoView = originalScrollIntoView;
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: originalInnerHeight });
  });

  it('tracks scroll position while mounted and removes the scroll listener on unmount', async () => {
    const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

    const { unmount } = renderWithSections();

    expect(screen.getByTestId('active-section')).toHaveTextContent('About');
    expect(addEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function));

    const cases = [
      [0, 'About'],
      [100, 'Education'],
      [200, 'Projects'],
      [300, 'Experience'],
      [400, 'RepoDocs'],
      [500, 'Legal'],
    ];

    for (const [scrollY, expectedSection] of cases) {
      window.scrollY = scrollY;
      fireEvent.scroll(window);
      await waitFor(() => expect(screen.getByTestId('active-section')).toHaveTextContent(expectedSection));
    }

    unmount();
    expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
  });

  it('scrolls to the correct legal section when the corresponding button is clicked', () => {
    renderWithSections();

    fireEvent.click(screen.getByRole('button', { name: /jump to impressum section/i }));
    fireEvent.click(screen.getByRole('button', { name: /jump to privacy policy section/i }));

    expect(HTMLElement.prototype.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
    expect(HTMLElement.prototype.scrollIntoView).toHaveBeenCalledTimes(2);
  });

  it('defaults to the About section when no section element matches the current scroll position', async () => {
    render(
      <>
        <Sidebar />
        <div id="Education" data-offset-top="100" />
        <div id="Projects" data-offset-top="200" />
      </>
    );

    window.scrollY = 0;
    fireEvent.scroll(window);

    await waitFor(() => expect(screen.getByTestId('active-section')).toHaveTextContent('About'));
  });

  it('does not call scrollIntoView when the target legal section is absent from the DOM', () => {
    render(
      <>
        <Sidebar />
        <div id="Education" data-offset-top="100" />
        <div id="Projects" data-offset-top="200" />
      </>
    );

    fireEvent.click(screen.getByRole('button', { name: /jump to impressum section/i }));
    fireEvent.click(screen.getByRole('button', { name: /jump to privacy policy section/i }));

    expect(HTMLElement.prototype.scrollIntoView).not.toHaveBeenCalled();
  });
});
