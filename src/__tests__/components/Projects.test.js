import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import Projects from '../../components/Projects/Projects';

// Mock i18n
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k, def) => def || k }) }));

// Stub ProjectCard to make assertions simple
jest.mock('../../components/Projects/ProjectCard', () => ({
  __esModule: true,
  default: ({ project, image, index }) => (
    <div data-testid="project-card" data-name={project.name} data-image={image} data-index={index} />
  ),
}));

jest.mock('../../components/Projects/projectsUtils', () => ({
  __esModule: true,
  getPrimaryImage: jest.fn().mockImplementation((p) => `/projects_media/${p.name}/project-image.png`),
}));

describe('Projects component', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it('fetches projects.json and renders ProjectCard for each item', async () => {
    const fake = [{ name: 'proj-a' }, { name: 'proj-b' }];
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => fake });

    render(<Projects />);

    await waitFor(() => expect(screen.getAllByTestId('project-card').length).toBe(2));

    const cards = screen.getAllByTestId('project-card');
    expect(cards[0].getAttribute('data-name')).toBe('proj-a');
    expect(cards[0].getAttribute('data-image')).toContain('/projects_media/proj-a');
  });

  it('ignores fetch errors and renders no cards when fetch fails', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('network'));
    render(<Projects />);
    await new Promise(r => setTimeout(r, 50));
    expect(screen.queryByTestId('project-card')).toBeNull();
  });
});
