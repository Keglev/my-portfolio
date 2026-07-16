/*
 * Tests for Hero.js
 * Covers: locale-driven copy, language-specific CV link, and CTA scroll targets.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Hero from '../../components/Hero/Hero';

jest.mock('react-i18next', () => ({ useTranslation: jest.fn() }));
const { useTranslation } = require('react-i18next');

describe('Hero', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders eyebrow, headline with highlight, lead, and three CTAs in English', () => {
    useTranslation.mockReturnValue({ t: (k) => k, i18n: { language: 'en' } });
    render(<Hero />);
    expect(screen.getByText('hero.eyebrow')).toBeInTheDocument();
    expect(screen.getByText('hero.headlineHighlight')).toBeInTheDocument();
    expect(screen.getByText('hero.lead')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'hero.ctaCv' })).toHaveAttribute('href', '/Carlos_Keglevich_CV_EN.pdf');
  });

  it('serves the German CV for de locales (incl. de-DE)', () => {
    useTranslation.mockReturnValue({ t: (k) => k, i18n: { language: 'de-DE' } });
    render(<Hero />);
    expect(screen.getByRole('link', { name: 'hero.ctaCv' })).toHaveAttribute('href', '/Carlos_Keglevich_Lebenslauf_DE.pdf');
  });

  it('scrolls to the Projects section on the primary CTA', () => {
    useTranslation.mockReturnValue({ t: (k) => k, i18n: { language: 'en' } });
    const target = document.createElement('div');
    target.id = 'Projects';
    target.scrollIntoView = jest.fn();
    document.body.appendChild(target);

    render(<Hero />);
    fireEvent.click(screen.getByRole('button', { name: 'hero.ctaProjects' }));
    expect(target.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });

    document.body.removeChild(target);
  });
});
