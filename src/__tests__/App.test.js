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
jest.mock('../i18n', () => ({ __esModule: true, default: {} }));

// Provide a simple translation function for all components that use useTranslation
// Include i18n object so SidebarMenu's i18n.language check doesn't throw
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, fallback) => fallback || key,
    i18n: { language: 'de', changeLanguage: jest.fn() },
  }),
  initReactI18next: { type: '3rdParty', init: jest.fn() },
}));

// Prevent react-scroll from being used (it needs a real DOM scroll container)
// Use require('react') inside the factory -- jest.mock factories are hoisted before imports
jest.mock('react-scroll', () => {
  const R = require('react');
  return {
    Link: ({ children, to }) => R.createElement('a', { href: `#${to}` }, children),
    Element: ({ children }) => R.createElement('div', null, children),
    Events: { scrollEvent: { register: jest.fn(), remove: jest.fn() } },
    animateScroll: {},
    scrollSpy: { update: jest.fn() },
  };
});

// Stub Projects to a bare marker element -- Projects.js itself renders from static
// config (data/projects.config), not a fetch, but this test only cares that App
// mounts a Projects section, not what Projects itself renders.
jest.mock('../components/Projects/Projects', () => {
  const React = require('react');
  return { __esModule: true, default: () => React.createElement('section', { 'data-testid': 'projects' }) };
});

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
