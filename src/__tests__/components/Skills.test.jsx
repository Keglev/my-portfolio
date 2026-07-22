/**
 * @file Skills.test.js
 * @module src/__tests__/components/Skills
 * @testing components/Skills/Skills.js
 * @description Contract test for the Skills section: one card renders
 * per curated group with its localized heading key, and every technology
 * chip within each group renders.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k) => k }) }));
vi.mock('../../data/skills.config', () => ({
  default: [
    { id: 'a', titleKey: 'skillsSection.backend', items: ['Java', 'Spring Boot'] },
    { id: 'b', titleKey: 'skillsSection.frontend', items: ['React'] },
  ],
}));

import Skills from '../../components/Skills/Skills';

describe('Skills', () => {
  it('should render a card per group and every chip when Skills mounts', () => {
    render(<Skills />);

    expect(screen.getByText('skillsSection.backend')).toBeInTheDocument();
    expect(screen.getByText('skillsSection.frontend')).toBeInTheDocument();
    expect(screen.getByText('Java')).toBeInTheDocument();
    expect(screen.getByText('Spring Boot')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
  });
});
