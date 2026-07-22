/**
 * @file About.test.js
 * @module src/__tests__/components/About
 * @testing components/About/About.js, components/About/CareerStrip.js
 * @description Contract tests for the About section: the four
 * storytelling blocks, the career/education strip lists, and the profile
 * image's public-path src with bundled-asset fallback on load error.
 *
 * Out of scope: CareerStrip's own i18n list-resource guard against a
 * missing/malformed translation resource (not exercised here; this mock
 * always returns well-formed arrays).
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import About from '../../components/About/About';

vi.mock('react-i18next', () => ({
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

describe('About', () => {
  it('should render the heading and all four storytelling blocks when About mounts', () => {
    render(<About />);

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('About me');
    ['one', 'two', 'three', 'four'].forEach((n) => {
      expect(screen.getByText(`Block ${n} title`)).toBeInTheDocument();
      expect(screen.getByText(`Block ${n} text`)).toBeInTheDocument();
    });
  });

  it('should render the career strip with both career and education entries when About mounts', () => {
    render(<About />);

    expect(screen.getByText('Career at a glance')).toBeInTheDocument();
    expect(screen.getByText('Education & certification')).toBeInTheDocument();
    expect(screen.getByText('Career line A')).toBeInTheDocument();
    expect(screen.getByText('Career line B')).toBeInTheDocument();
    expect(screen.getByText('Education line A')).toBeInTheDocument();
  });

  it('should fall back to the bundled asset once when the profile image fails to load', () => {
    render(<About />);
    const img = screen.getByAltText('Carlos Keglevich portrait');

    expect(img).toHaveAttribute('src', '/profile.jpg');

    fireEvent.error(img);

    expect(img.getAttribute('src')).not.toBe('/profile.jpg');
    expect(img.getAttribute('data-fallback')).toBe('1');
  });
});
