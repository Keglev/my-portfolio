/**
 * @file Projects.test.js
 * @module src/__tests__/components/Projects
 * @testing components/Projects/Projects.js
 * @description Contract tests for the Projects section: it renders one
 * ProjectCard per curated config entry with the correct project + index
 * props, and renders the portfolio-meta strip's source/docs/coverage
 * links. ProjectCard is stubbed to assert wiring, not card internals.
 *
 * Out of scope: ProjectCard's own rendering (see ProjectCard.test.js).
 * Data comes from the static config module, so there is no fetch to mock.
 */
import React from 'react';
import Projects from '../../components/Projects/Projects';
import { render, screen } from '@testing-library/react';

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k, def) => def || k }) }));

// Deterministic, minimal config so the test does not depend on real copy.
vi.mock('../../data/projects.config', () => ({
  default: [
    { slug: 'proj-a', displayName: 'Proj A' },
    { slug: 'proj-b', displayName: 'Proj B' },
  ],
}));

// Stub ProjectCard so we assert wiring, not the real card internals.
vi.mock('../../components/Projects/ProjectCard', () => ({
  default: ({ project, index }) => (
    <div data-testid="project-card" data-slug={project && project.slug} data-index={index} />
  ),
}));

describe('Projects', () => {
  it('should render one ProjectCard per curated config entry when Projects mounts', () => {


    render(<Projects />);
    const cards = screen.getAllByTestId('project-card');

    expect(cards).toHaveLength(2);
    expect(cards[0].getAttribute('data-slug')).toBe('proj-a');
    expect(cards[0].getAttribute('data-index')).toBe('0');
    expect(cards[1].getAttribute('data-slug')).toBe('proj-b');
  });

  it('should render the portfolio-meta strip with links to source, docs, and coverage when Projects mounts', () => {


    render(<Projects />);

    expect(screen.getByText('portfolioMeta.text', { exact: false })).toBeInTheDocument();
    const source = screen.getByRole('link', { name: 'portfolioMeta.source' });
    expect(source).toHaveAttribute('href', 'https://github.com/Keglev/my-portfolio');
    expect(source).toHaveAttribute('target', '_blank');
    expect(source).toHaveAttribute('rel', 'noopener noreferrer');
    const docs = screen.getByRole('link', { name: 'portfolioMeta.docs' });
    expect(docs).toHaveAttribute('href', 'https://keglev.github.io/my-portfolio/');
    const coverage = screen.getByRole('link', { name: 'portfolioMeta.coverage' });
    expect(coverage).toHaveAttribute('href', 'https://keglev.github.io/my-portfolio/coverage/index.html');
  });
});
