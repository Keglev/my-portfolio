/*
 * Tests for Projects.js
 * Covers: rendering one ProjectCard per curated config entry, and passing the
 * correct project + index props. Data now comes from the static config module,
 * so there is no fetch to mock.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k, def) => def || k }) }));

// Deterministic, minimal config so the test does not depend on real copy.
jest.mock('../../data/projects.config', () => ({
  __esModule: true,
  default: [
    { slug: 'proj-a', displayName: 'Proj A' },
    { slug: 'proj-b', displayName: 'Proj B' },
  ],
}));

// Stub ProjectCard so we assert wiring, not the real card internals.
jest.mock('../../components/Projects/ProjectCard', () => ({
  __esModule: true,
  default: ({ project, index }) => (
    <div data-testid="project-card" data-slug={project && project.slug} data-index={index} />
  ),
}));

describe('Projects component', () => {
  it('renders one ProjectCard per curated config entry', () => {
    // eslint-disable-next-line global-require
    const Projects = require('../../components/Projects/Projects').default;
    render(<Projects />);

    const cards = screen.getAllByTestId('project-card');
    expect(cards).toHaveLength(2);
    expect(cards[0].getAttribute('data-slug')).toBe('proj-a');
    expect(cards[0].getAttribute('data-index')).toBe('0');
    expect(cards[1].getAttribute('data-slug')).toBe('proj-b');
  });

  it('renders the portfolio-meta strip with links to source, docs and coverage', () => {
    // eslint-disable-next-line global-require
    const Projects = require('../../components/Projects/Projects').default;
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
