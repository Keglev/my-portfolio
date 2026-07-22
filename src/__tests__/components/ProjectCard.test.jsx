/**
 * @file ProjectCard.test.js
 * @module src/__tests__/components/ProjectCard
 * @testing components/Projects/ProjectCard.js
 * @description Contract tests for a single project card: language-variant
 * summary and preview-image selection, tech tag rendering, the locked
 * link order (live, docs, repo, secondary repo, API), the doc-links-row's
 * per-language titles, and the single-step image placeholder fallback.
 *
 * Out of scope: ProjectSummary's own rendering (covered by its own test
 * file); this only verifies ProjectCard passes it the right props.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ProjectCard from '../../components/Projects/ProjectCard';

vi.mock('react-i18next', () => ({ useTranslation: vi.fn() }));
import { useTranslation } from 'react-i18next';

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
  beforeEach(() => vi.clearAllMocks());

  it('should render the title, English summary, and tech tags when the language is English', () => {
    useTranslation.mockReturnValue({ t: (k, def) => def || k, i18n: { language: 'en' } });

    render(<ProjectCard project={baseProject} index={0} />);

    expect(screen.getByText('Demo Project')).toBeInTheDocument();
    expect(screen.getByText('english summary')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('Jest')).toBeInTheDocument();
  });

  it('should render the German summary when the language is de', () => {
    useTranslation.mockReturnValue({ t: (k, def) => def || k, i18n: { language: 'de' } });

    render(<ProjectCard project={baseProject} index={0} />);

    expect(screen.getByText('deutsche Zusammenfassung')).toBeInTheDocument();
    expect(screen.queryByText('english summary')).toBeNull();
  });

  it('should select the dark English preview image when the language is English', () => {
    useTranslation.mockReturnValue({ t: (k, def) => def || k, i18n: { language: 'en' } });

    render(<ProjectCard project={baseProject} index={0} />);

    expect(screen.getByAltText('Demo Project preview')).toHaveAttribute('src', '/projects/demo-dark-en.png');
  });

  it('should select the dark German preview image when the locale is a de variant (incl. de-DE)', () => {
    useTranslation.mockReturnValue({ t: (k, def) => def || k, i18n: { language: 'de-DE' } });

    render(<ProjectCard project={baseProject} index={0} />);

    expect(screen.getByAltText('Demo Project preview')).toHaveAttribute('src', '/projects/demo-dark-de.png');
  });

  it('should render only the repo link when no optional links are present', () => {
    useTranslation.mockReturnValue({ t: (k, def) => def || k, i18n: { language: 'en' } });

    render(<ProjectCard project={baseProject} index={0} />);
    const links = screen.getAllByRole('link');

    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute('href', 'https://github.com/Keglev/demo');
  });

  it('should render live, docs, repo, secondary-repo, and API links in the locked order when all optional links are present', () => {
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

  it('should render doc-links-row titles in English or German depending on the active language', () => {
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

  it('should fall back to an inline SVG placeholder once when the image errors, and not loop on a second error', () => {
    useTranslation.mockReturnValue({ t: (k, def) => def || k, i18n: { language: 'en' } });
    const setLoadedImages = vi.fn();
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
