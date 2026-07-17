/*
 * Tests for About.js and CareerStrip.js
 * Covers: four storytelling blocks, career/education strip lists,
 * profile image with public-path src and bundled-asset fallback on error.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import About from '../../components/About/About';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, opts) => {
      const map = {
        'aboutSection.heading': 'About me',
        'aboutSection.block1.title': 'Block one title',
        'aboutSection.block1.text': 'Block one text',
        'aboutSection.block2.title': 'Block two title',
        'aboutSection.block2.text': 'Block two text',
        'aboutSection.block3.title': 'Block three title',
        'aboutSection.block3.text': 'Block three text',
        'aboutSection.block4.title': 'Block four title',
        'aboutSection.block4.text': 'Block four text',
        'aboutSection.careerHeading': 'Career at a glance',
        'aboutSection.educationHeading': 'Education & certification',
      };
      if (opts && opts.returnObjects) {
        if (key === 'aboutSection.career') return ['Career line A', 'Career line B'];
        if (key === 'aboutSection.educationItems') return ['Education line A'];
      }
      return map[key] || key;
    },
  }),
}));

describe('About component', () => {
  it('renders the heading and all four storytelling blocks', () => {
    render(<About />);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('About me');
    ['one', 'two', 'three', 'four'].forEach((n) => {
      expect(screen.getByText(`Block ${n} title`)).toBeInTheDocument();
      expect(screen.getByText(`Block ${n} text`)).toBeInTheDocument();
    });
  });

  it('renders the career strip with both columns and their entries', () => {
    render(<About />);
    expect(screen.getByText('Career at a glance')).toBeInTheDocument();
    expect(screen.getByText('Education & certification')).toBeInTheDocument();
    expect(screen.getByText('Career line A')).toBeInTheDocument();
    expect(screen.getByText('Career line B')).toBeInTheDocument();
    expect(screen.getByText('Education line A')).toBeInTheDocument();
  });

  it('prefers /profile.jpg and falls back to the bundled asset once on error', () => {
    render(<About />);
    const img = screen.getByAltText('Carlos Keglevich portrait');
    expect(img).toHaveAttribute('src', '/profile.jpg');
    fireEvent.error(img);
    expect(img.getAttribute('src')).not.toBe('/profile.jpg');
    expect(img.getAttribute('data-fallback')).toBe('1');
  });
});
