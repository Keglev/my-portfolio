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
  image: '/projects/demo.png',
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

  it('renders only the repo link when no optional links are present', () => {
    useTranslation.mockReturnValue({ t: (k, def) => def || k, i18n: { language: 'en' } });
    render(<ProjectCard project={baseProject} index={0} />);
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute('href', 'https://github.com/Keglev/demo');
  });

  it('renders secondary repo, live and docs links when provided', () => {
    useTranslation.mockReturnValue({ t: (k, def) => def || k, i18n: { language: 'en' } });
    const project = {
      ...baseProject,
      repoUrlSecondary: 'https://github.com/Keglev/demo-frontend',
      liveUrl: 'https://demo.example.com',
      docsUrl: 'https://keglev.github.io/demo/',
    };
    render(<ProjectCard project={project} index={0} />);
    const hrefs = screen.getAllByRole('link').map((a) => a.getAttribute('href'));
    expect(hrefs).toEqual([
      'https://github.com/Keglev/demo',
      'https://github.com/Keglev/demo-frontend',
      'https://demo.example.com',
      'https://keglev.github.io/demo/',
    ]);
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
