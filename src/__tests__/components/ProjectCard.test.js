/*
 * Tests for ProjectCard.js
 * Covers: language variant rendering, summary fallback logic, image branch-retry behaviour,
 * placeholder SVG, and production-URL rewriting.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ProjectCard from '../../components/Projects/ProjectCard';

jest.mock('react-i18next', () => ({ useTranslation: jest.fn() }));
const { useTranslation } = require('react-i18next');

describe('ProjectCard', () => {
  beforeEach(() => jest.clearAllMocks());

  it('displays German summary when available and does not show translation notice', () => {
    useTranslation.mockReturnValue({ t: (k) => k, i18n: { language: 'de' } });
    const project = { name: 'p1', summary: 'en', summary_de: 'de' };
    render(<ProjectCard project={project} index={0} />);
    expect(screen.getByText('de')).toBeInTheDocument();
    expect(screen.queryByText(/Übersetzung fehlt/)).toBeNull();
  });

  it('shows translation notice when German is selected but no German summary exists', () => {
    useTranslation.mockReturnValue({ t: (k) => (k === 'translationMissing' ? 'Übersetzung fehlt' : k), i18n: { language: 'de' } });
    const project = {
      name: 'p2',
      summary: 'en',
      summary_de: '',
      object: { text: '## About\nabout me\n## Next' },
    };
    render(<ProjectCard project={project} index={1} />);
    expect(screen.getByText('about me')).toBeInTheDocument();
    expect(screen.getByText(/Übersetzung fehlt/)).toBeInTheDocument();
  });

  it('renders the English summary and technology tags', () => {
    useTranslation.mockReturnValue({ t: (k) => k, i18n: { language: 'en' } });
    const project = { name: 'p3', summary: 'english summary', technologies: ['React', 'Jest'] };
    render(<ProjectCard project={project} index={3} />);
    expect(screen.getByText('english summary')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('Jest')).toBeInTheDocument();
  });

  it('renders a skeleton when no summary or about section is available', () => {
    useTranslation.mockReturnValue({ t: (k) => k, i18n: { language: 'en' } });
    const project = { name: 'p4' };
    render(<ProjectCard project={project} index={4} />);
    expect(screen.getByRole('img', { name: 'p4 project' })).toBeInTheDocument();
    expect(screen.getByTestId('project-summary-skeleton')).toBeInTheDocument();
  });

  it('rewrites raw GitHub production links to github.com/blob links', () => {
    useTranslation.mockReturnValue({ t: (k) => k, i18n: { language: 'en' } });
    const project = {
      name: 'p5',
      summary: 'summary',
      repoDocs: {
        productionUrl: {
          link: 'https://raw.githubusercontent.com/keglev/p5/main/README.md',
        },
      },
    };
    render(<ProjectCard project={project} index={5} />);
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute('href', 'https://github.com/keglev/p5/blob/main/README.md');
  });

  it('attempts main then master branch URLs before falling back on image error', () => {
    useTranslation.mockReturnValue({ t: (k) => k, i18n: { language: 'en' } });
    const project = { name: 'pimg', summary: 's' };
    const setLoadedImages = jest.fn();
    render(<ProjectCard project={project} index={2} setLoadedImages={setLoadedImages} />);

    const img = screen.getByAltText('pimg project');

    fireEvent.load(img);
    expect(setLoadedImages).toHaveBeenCalled();

    // first error → main branch
    fireEvent.error(img);
    expect(img.getAttribute('data-try')).toBe('1');
    expect(img.getAttribute('src')).toContain('pimg/main');

    // second error → master branch
    fireEvent.error(img);
    expect(img.getAttribute('data-try')).toBe('2');
    expect(img.getAttribute('src')).toContain('pimg/master');
  });

  it('falls back to the placeholder SVG when all branch attempts are exhausted', () => {
    useTranslation.mockReturnValue({ t: (k) => k, i18n: { language: 'en' } });
    const project = { name: 'p6', summary: 's' };
    const setLoadedImages = jest.fn();
    render(<ProjectCard project={project} index={6} setLoadedImages={setLoadedImages} />);

    const img = screen.getByAltText('p6 project');
    img.setAttribute('data-try', '2');
    fireEvent.error(img);

    expect(img.getAttribute('src')).toContain('data:image/svg+xml');
    expect(img.getAttribute('src')).toContain('p6');
    expect(setLoadedImages).toHaveBeenCalled();
  });
});
