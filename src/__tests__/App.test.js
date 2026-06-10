/*
 * Tests for App.js
 * Covers: top-level render, presence of all major sections (About, Projects,
 * Education, Experience, RepoDocs, Legal), and i18n integration.
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
// Use require('react') inside the factory — jest.mock factories are hoisted before imports
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

// Stub Projects to avoid the runtime fetch('/projects.json') call
jest.mock('../components/Projects/Projects', () => {
  const React = require('react');
  return { __esModule: true, default: () => React.createElement('section', { 'data-testid': 'projects' }) };
});

// Stub RepoDocs to avoid async fetching
jest.mock('../components/RepoDocs/RepoDocs', () => {
  const React = require('react');
  return { __esModule: true, default: () => React.createElement('section', { 'data-testid': 'repodocs' }) };
});

describe('App', () => {
  function setup() {
    render(<App />);
  }

  test('renders the outer container div', () => {
    setup();
    expect(document.querySelector('.container')).toBeInTheDocument();
  });

  test('renders the main-content scroll container', () => {
    setup();
    expect(document.getElementById('scroll-container')).toBeInTheDocument();
  });

  test('renders the About section', () => {
    setup();
    expect(document.getElementById('About')).toBeInTheDocument();
  });

  test('renders the Education section', () => {
    setup();
    expect(document.getElementById('Education')).toBeInTheDocument();
  });

  test('renders the Projects section', () => {
    setup();
    expect(document.getElementById('Projects')).toBeInTheDocument();
  });

  test('renders the RepoDocs section', () => {
    setup();
    expect(document.getElementById('RepoDocs')).toBeInTheDocument();
  });

  test('renders the Experience section', () => {
    setup();
    expect(document.getElementById('Experience')).toBeInTheDocument();
  });

  test('renders the Legal section', () => {
    setup();
    expect(document.getElementById('Legal')).toBeInTheDocument();
  });
});
