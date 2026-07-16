/*
 * Tests for Skills.js (curated static config).
 * Covers: one card per group with localized heading key, and all chips rendered.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k) => k }) }));
jest.mock('../../data/skills.config', () => ({
  __esModule: true,
  default: [
    { id: 'a', titleKey: 'skillsSection.backend', items: ['Java', 'Spring Boot'] },
    { id: 'b', titleKey: 'skillsSection.frontend', items: ['React'] },
  ],
}));

const Skills = require('../../components/Skills/Skills').default;

describe('Skills', () => {
  it('renders a card per group and every chip', () => {
    render(<Skills />);
    expect(screen.getByText('skillsSection.backend')).toBeInTheDocument();
    expect(screen.getByText('skillsSection.frontend')).toBeInTheDocument();
    expect(screen.getByText('Java')).toBeInTheDocument();
    expect(screen.getByText('Spring Boot')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
  });
});
