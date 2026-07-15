/*
 * Tests for RepoDocs.js and RepoDocLinks.js (curated static config).
 * Covers: rendering one card per config entry, all doc links with correct hrefs,
 * English/German label selection, and the empty-state fallback. No fetch is
 * involved — data comes from src/data/repoDocs.config.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';

const CONFIG = [
  {
    slug: 'alpha',
    displayName: 'Alpha',
    links: [
      { titleEn: 'Docs hub', titleDe: 'Doku-Hub', url: 'https://example.com/alpha' },
      { titleEn: 'API reference', titleDe: 'API-Referenz', url: 'https://example.com/alpha/api' },
    ],
  },
  {
    slug: 'beta',
    displayName: 'Beta',
    links: [
      { titleEn: 'Coverage', titleDe: 'Abdeckung', url: 'https://example.com/beta/cov' },
    ],
  },
];

const renderWith = (config, language) => {
  jest.doMock('react-i18next', () => ({
    useTranslation: () => ({ t: (k) => k, i18n: { language } }),
  }));
  jest.doMock('../../data/repoDocs.config', () => ({ __esModule: true, default: config }));
  // eslint-disable-next-line global-require
  const RepoDocs = require('../../components/RepoDocs/RepoDocs').default;
  return render(<RepoDocs />);
};

describe('RepoDocs (curated static config)', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('renders one card per config entry with English labels and correct hrefs', () => {
    renderWith(CONFIG, 'en');

    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();

    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(3);

    const hub = screen.getByRole('link', { name: 'Docs hub' });
    expect(hub).toHaveAttribute('href', 'https://example.com/alpha');
    expect(hub).toHaveAttribute('target', '_blank');
    expect(hub).toHaveAttribute('rel', 'noopener noreferrer');

    expect(screen.getByRole('link', { name: 'API reference' })).toHaveAttribute('href', 'https://example.com/alpha/api');
    expect(screen.getByRole('link', { name: 'Coverage' })).toHaveAttribute('href', 'https://example.com/beta/cov');
  });

  it('renders German labels when the language is de', () => {
    renderWith(CONFIG, 'de-DE');

    expect(screen.getByRole('link', { name: 'Doku-Hub' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'API-Referenz' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Abdeckung' })).toBeInTheDocument();
    expect(screen.queryByText('Docs hub')).toBeNull();
  });

  it('renders the empty state when the config is empty', () => {
    renderWith([], 'en');

    expect(screen.getByText('noRepoDocs')).toBeInTheDocument();
    expect(screen.queryAllByRole('link')).toHaveLength(0);
  });
});
