/*
 * Tests for ProjectCard.js
 * Covers: language variant summary rendering, tech tag rendering, conditional
 * links (repo / secondary repo / live / docs), and the single-step image
 * placeholder fallback.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ProjectCard from '../../components/Projects/ProjectCard';

jest.mock('react-i18next', () => ({ useTranslation: jest.fn() }));
const { useTranslation } = require('react-i18next');

const baseProject = {
  slug: 'demo',
  displayName: 'Demo Project',
  summaryEn: 'english summary',
  summaryDe: 'deutsche Zusammenfassung',
  tech: ['React', 'Jest'],
  images: {
    dark: { en: '/projects/demo-dark-en.png', de: '/projects/demo-dark-de.png' },
    light: { en: '/projects/demo-light-en.png', de: '/projects/demo-light-de.png' },
  },
  repoUrl: 'https://github.com/Keglev/demo',
  repoUrlSecondary: null,
  liveUrl: null,
  docsUrl: null,
};

describe('ProjectCard', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders the English summary, title and tech tags in English', () => {
    useTranslation.mockReturnValue({ t: (k, def) => def || k, i18n: { language: 'en' } });
    render(<ProjectCard project={baseProject} index={0} />);
    expect(screen.getByText('Demo Project')).toBeInTheDocument();
    expect(screen.getByText('english summary')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('Jest')).toBeInTheDocument();
  });

  it('renders the German summary when the language is de', () => {
    useTranslation.mockReturnValue({ t: (k, def) => def || k, i18n: { language: 'de' } });
    render(<ProjectCard project={baseProject} index={0} />);
    expect(screen.getByText('deutsche Zusammenfassung')).toBeInTheDocument();
    expect(screen.queryByText('english summary')).toBeNull();
  });

  it('selects the dark English preview image in English', () => {
    useTranslation.mockReturnValue({ t: (k, def) => def || k, i18n: { language: 'en' } });
    render(<ProjectCard project={baseProject} index={0} />);
    expect(screen.getByAltText('Demo Project preview')).toHaveAttribute('src', '/projects/demo-dark-en.png');
  });

  it('selects the dark German preview image in German (incl. locale like de-DE)', () => {
    useTranslation.mockReturnValue({ t: (k, def) => def || k, i18n: { language: 'de-DE' } });
    render(<ProjectCard project={baseProject} index={0} />);
    expect(screen.getByAltText('Demo Project preview')).toHaveAttribute('src', '/projects/demo-dark-de.png');
  });

  it('renders only the repo link when no optional links are present', () => {
    useTranslation.mockReturnValue({ t: (k, def) => def || k, i18n: { language: 'en' } });
    render(<ProjectCard project={baseProject} index={0} />);
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute('href', 'https://github.com/Keglev/demo');
  });

  it('renders secondary repo, live, docs and API links in the locked order', () => {
    useTranslation.mockReturnValue({ t: (k, def) => def || k, i18n: { language: 'en' } });
    const project = {
      ...baseProject,
      repoUrlSecondary: 'https://github.com/Keglev/demo-frontend',
      liveUrl: 'https://demo.example.com',
      docsUrl: 'https://keglev.github.io/demo/',
      apiUrl: 'https://keglev.github.io/demo/api/index.html',
    };
    render(<ProjectCard project={project} index={0} />);
    const links = screen.getAllByRole('link');
    const hrefs = links.map((a) => a.getAttribute('href'));
    expect(hrefs).toEqual([
      'https://demo.example.com',
      'https://keglev.github.io/demo/',
      'https://github.com/Keglev/demo',
      'https://github.com/Keglev/demo-frontend',
      'https://keglev.github.io/demo/api/index.html',
    ]);
    expect(links[1]).toHaveTextContent('Documentation hub');
    expect(links[4]).toHaveTextContent('API reference');
  });

  it('renders the doc-links-row with English titles, and German titles when the language is de', () => {
    const project = {
      ...baseProject,
      docLinks: [
        { titleEn: 'Architecture overview', titleDe: 'Architektur-Überblick', url: 'https://keglev.github.io/demo/architecture.html' },
        { titleEn: 'Test coverage', titleDe: 'Testabdeckung', url: 'https://keglev.github.io/demo/coverage.html' },
      ],
    };

    useTranslation.mockReturnValue({ t: (k, def) => def || k, i18n: { language: 'en' } });
    const { rerender } = render(<ProjectCard project={project} index={0} />);
    expect(screen.getByRole('list')).toHaveClass('doc-links-row');
    expect(screen.getByText('Architecture overview')).toBeInTheDocument();
    expect(screen.getByText('Test coverage')).toBeInTheDocument();

    useTranslation.mockReturnValue({ t: (k, def) => def || k, i18n: { language: 'de' } });
    rerender(<ProjectCard project={project} index={0} />);
    expect(screen.getByText('Architektur-Überblick')).toBeInTheDocument();
    expect(screen.getByText('Testabdeckung')).toBeInTheDocument();
  });

  it('falls back to an inline SVG placeholder on image error, once', () => {
    useTranslation.mockReturnValue({ t: (k, def) => def || k, i18n: { language: 'en' } });
    const setLoadedImages = jest.fn();
    render(<ProjectCard project={baseProject} index={2} setLoadedImages={setLoadedImages} />);

    const img = screen.getByAltText('Demo Project preview');

    fireEvent.load(img);
    expect(setLoadedImages).toHaveBeenCalled();

    fireEvent.error(img);
    expect(img.getAttribute('src')).toContain('data:image/svg+xml');
    expect(img.getAttribute('data-fallback')).toBe('1');

    // A second error must not loop back into the fallback.
    const srcAfterFirst = img.getAttribute('src');
    fireEvent.error(img);
    expect(img.getAttribute('src')).toBe(srcAfterFirst);
  });
});
