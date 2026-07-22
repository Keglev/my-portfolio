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
import { ThemeProvider } from '../../context/ThemeContext';

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

  describe('preview image selection', () => {
    // The card picks a screenshot by active theme first, then by language.
    // Every step below the first exists so that one missing asset degrades to
    // a slightly-wrong-but-correct-looking image instead of an empty card.
    const imageOf = () => screen.getByAltText('Demo Project preview').getAttribute('src');

    beforeEach(() => {
      window.localStorage.clear();
      document.documentElement.removeAttribute('data-theme');
    });

    it('should show the German screenshot when the site language is German', () => {
      useTranslation.mockReturnValue({ t: (k, def) => def || k, i18n: { language: 'de' } });

      render(<ProjectCard project={baseProject} index={0} />);

      expect(imageOf()).toBe('/projects/demo-dark-de.png');
    });

    it('should show the light-theme screenshot when the visitor has chosen the light theme', () => {
      useTranslation.mockReturnValue({ t: (k, def) => def || k, i18n: { language: 'en' } });
      window.localStorage.setItem('portfolio-theme', 'light');

      render(
        <ThemeProvider>
          <ProjectCard project={baseProject} index={0} />
        </ThemeProvider>
      );

      expect(imageOf()).toBe('/projects/demo-light-en.png');
    });

    it('should fall back to the English screenshot when the German one is missing', () => {
      // A German visitor still sees the project, just captioned in English,
      // rather than an empty image frame.
      useTranslation.mockReturnValue({ t: (k, def) => def || k, i18n: { language: 'de' } });
      const project = {
        ...baseProject,
        images: { dark: { en: '/projects/demo-dark-en.png' } },
      };

      render(<ProjectCard project={project} index={0} />);

      expect(imageOf()).toBe('/projects/demo-dark-en.png');
    });

    it('should fall back to the dark screenshot when the light theme has no image at all', () => {
      // Light-theme screenshots are added per project over time; until one
      // exists, the dark capture is shown rather than nothing.
      useTranslation.mockReturnValue({ t: (k, def) => def || k, i18n: { language: 'en' } });
      window.localStorage.setItem('portfolio-theme', 'light');
      const project = {
        ...baseProject,
        images: { dark: { en: '/projects/demo-dark-en.png' } },
      };

      render(
        <ThemeProvider>
          <ProjectCard project={project} index={0} />
        </ThemeProvider>
      );

      expect(imageOf()).toBe('/projects/demo-dark-en.png');
    });

    it('should still render the card when the project has no screenshots configured at all', () => {
      // A newly added project with no imagery must not break the grid; the
      // empty src triggers the placeholder path on error.
      useTranslation.mockReturnValue({ t: (k, def) => def || k, i18n: { language: 'en' } });
      const project = { ...baseProject, images: undefined };

      render(<ProjectCard project={project} index={0} />);

      expect(imageOf()).toBe('');
      expect(screen.getByText('Demo Project')).toBeInTheDocument();
    });

    it('should treat a regional German locale as German when choosing the screenshot', () => {
      useTranslation.mockReturnValue({ t: (k, def) => def || k, i18n: { language: 'de-DE' } });

      render(<ProjectCard project={baseProject} index={0} />);

      expect(imageOf()).toBe('/projects/demo-dark-de.png');
    });

    it('should show the English screenshot when the language has not been resolved yet', () => {
      // i18n.language is undefined for the first frame after mount.
      useTranslation.mockReturnValue({ t: (k, def) => def || k, i18n: { language: undefined } });

      render(<ProjectCard project={baseProject} index={0} />);

      expect(imageOf()).toBe('/projects/demo-dark-en.png');
    });

    it('should mark its own slot as loaded so the grid can fade the card in', () => {
      // The grid keeps one shared loaded-map for every card and uses it to add
      // the .visible/.loaded classes. Each card must record itself under its
      // OWN index without disturbing its siblings' entries.
      useTranslation.mockReturnValue({ t: (k, def) => def || k, i18n: { language: 'en' } });
      let tracked = { 0: true };
      const setLoadedImages = vi.fn((updater) => { tracked = updater(tracked); });
      render(<ProjectCard project={baseProject} index={3} setLoadedImages={setLoadedImages} />);

      fireEvent.load(screen.getByAltText('Demo Project preview'));

      expect(tracked).toEqual({ 0: true, 3: true });
    });

    it('should still mark its slot as loaded when the screenshot fails and the placeholder is shown', () => {
      // Otherwise a card whose image 404s stays permanently transparent,
      // because the grid never learns it finished.
      useTranslation.mockReturnValue({ t: (k, def) => def || k, i18n: { language: 'en' } });
      let tracked = {};
      const setLoadedImages = vi.fn((updater) => { tracked = updater(tracked); });
      render(<ProjectCard project={baseProject} index={1} setLoadedImages={setLoadedImages} />);

      fireEvent.error(screen.getByAltText('Demo Project preview'));

      expect(tracked).toEqual({ 1: true });
    });

    it('should render standalone, without the grid supplying load-tracking props', () => {
      // project and index are the only required props; the load-tracking pair
      // defaults to a no-op so the card can be rendered outside the Projects
      // grid without wiring up state it does not own.
      useTranslation.mockReturnValue({ t: (k, def) => def || k, i18n: { language: 'en' } });
      render(<ProjectCard project={baseProject} index={0} />);
      const img = screen.getByAltText('Demo Project preview');

      expect(() => fireEvent.load(img)).not.toThrow();
      expect(() => fireEvent.error(img)).not.toThrow();
      expect(img.getAttribute('src')).toContain('data:image/svg+xml');
    });
  });
});
