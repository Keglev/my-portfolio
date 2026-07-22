/**
 * @file App.test.js
 * @module src/__tests__/App
 * @testing App.js
 * @description Contract tests for the root App component: the top-level
 * render produces the container/scroll wrapper and all six section
 * wrappers (Hero, About, Skills, Projects, Contact, Legal) in the order
 * the sidebar nav expects.
 *
 * Out of scope: each section's own internal rendering (covered by that
 * section's own test file); Projects is stubbed here to a bare marker
 * element.
 */
/* eslint-disable testing-library/no-node-access */
import App from '../App';
import React from 'react';
import { render } from '@testing-library/react';

// Prevent i18n side-effect initialization from interfering
vi.mock('../i18n', () => ({ __esModule: true, default: {} }));

// Provide a simple translation function for all components that use useTranslation
// Include i18n object so SidebarMenu's i18n.language check doesn't throw
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, fallback) => fallback || key,
    i18n: { language: 'de', changeLanguage: vi.fn() },
  }),
  initReactI18next: { type: '3rdParty', init: vi.fn() },
}));

// Prevent react-scroll from being used (it needs a real DOM scroll container).
// The factory returns JSX directly: vi.mock factories are hoisted above imports,
// but their BODY runs lazily on first import of the mocked module, by which
// point the automatic JSX runtime is available. No React import is needed.
vi.mock('react-scroll', () => ({
  Link: ({ children, to }) => <a href={`#${to}`}>{children}</a>,
  Element: ({ children }) => <div>{children}</div>,
  Events: { scrollEvent: { register: vi.fn(), remove: vi.fn() } },
  animateScroll: {},
  scrollSpy: { update: vi.fn() },
}));

// Stub Projects to a bare marker element -- Projects.jsx itself renders from static
// config (data/projects.config), not a fetch, but this test only cares that App
// mounts a Projects section, not what Projects itself renders.
vi.mock('../components/Projects/Projects', () => ({
  default: () => <section data-testid="projects" />,
}));

describe('App', () => {
  function setup() {
    render(<App />);
  }

  it('should render the outer container div when App mounts', () => {
    setup();

    expect(document.querySelector('.container')).toBeInTheDocument();
  });

  it('should render the main-content scroll container when App mounts', () => {
    setup();

    expect(document.getElementById('scroll-container')).toBeInTheDocument();
  });

  it('should render the About section when App mounts', () => {
    setup();

    expect(document.getElementById('About')).toBeInTheDocument();
  });

  it('should render the Skills section when App mounts', () => {
    setup();

    expect(document.getElementById('Skills')).toBeInTheDocument();
  });

  it('should render the Projects section when App mounts', () => {
    setup();

    expect(document.getElementById('Projects')).toBeInTheDocument();
  });

  it('should render the Contact section when App mounts', () => {
    setup();

    expect(document.getElementById('Contact')).toBeInTheDocument();
  });

  it('should render the Legal section when App mounts', () => {
    setup();

    expect(document.getElementById('Legal')).toBeInTheDocument();
  });

  it('should render all sections in the expected order when App mounts', () => {
    setup();
    const ids = Array.from(document.querySelectorAll('.section')).map((el) => el.id);

    expect(ids).toEqual(['Hero', 'About', 'Skills', 'Projects', 'Contact', 'Legal']);
  });
});
