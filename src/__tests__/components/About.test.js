import React from 'react';
import { render, screen } from '@testing-library/react';
import About from '../../components/About/About';

// Mock translation hook to return predictable strings
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key) => {
    const map = {
      'aboutSection.heading': 'About Me',
      'aboutSection.description1': 'Intro one',
      'aboutSection.description2': 'Intro two',
      'aboutSection.description3': 'Intro three',
    };
    return map[key] || key;
  } }),
}));

describe('About component', () => {
  it('renders heading and descriptions from i18n', () => {
    render(<About />);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('About Me');
    expect(screen.getByText('Intro one')).toBeInTheDocument();
    expect(screen.getByText('Intro two')).toBeInTheDocument();
    expect(screen.getByText('Intro three')).toBeInTheDocument();
  });

  it('renders tech stack items and profile image', () => {
    render(<About />);

    // A few representative tech entries
    expect(screen.getByText(/Java 17/)).toBeInTheDocument();
    expect(screen.getByText(/React.js/)).toBeInTheDocument();
    expect(screen.getByText(/Docker & Docker Compose/)).toBeInTheDocument();

    // Profile image should be present with alt text
    const img = screen.getByAltText('Carlos Keglevich Profile');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src');
  });
});
