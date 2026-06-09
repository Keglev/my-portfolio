// Verifies that Projects fetches projects.json, renders one ProjectCard per item,
// and renders nothing when the fetch fails.
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k, def) => def || k }) }));

// Stub ProjectCard so tests can assert on data attributes without rendering the real card
jest.mock('../../components/Projects/ProjectCard', () => ({
  __esModule: true,
  default: ({ project, image, index }) => (
    <div
      data-testid="project-card"
      data-name={project && project.name}
      data-image={image || (project && `/projects_media/${project.name}/project-image.png`)}
      data-index={index}
    />
  ),
}));

describe('Projects component', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it('fetches projects.json and renders ProjectCard for each item', async () => {
    const fake = [{ name: 'proj-a' }, { name: 'proj-b' }];
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => fake });

    // require after mocks so the mocked ProjectCard is used
    // eslint-disable-next-line global-require
    const Projects = require('../../components/Projects/Projects').default;
    render(<Projects />);

    await waitFor(() => expect(screen.getAllByTestId('project-card').length).toBe(2));

    const cards = screen.getAllByTestId('project-card');
    expect(cards[0].getAttribute('data-name')).toBe('proj-a');
    expect(cards[0].getAttribute('data-image')).toContain('proj-a');
  });

  it('ignores fetch errors and renders no cards when fetch fails', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('network'));
    // require after mocks so the mocked ProjectCard is used
    // eslint-disable-next-line global-require
    const Projects = require('../../components/Projects/Projects').default;
    render(<Projects />);

    await waitFor(() => expect(screen.queryByTestId('project-card')).toBeNull());
  });
});
