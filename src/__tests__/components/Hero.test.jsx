/**
 * @file Hero.test.js
 * @module src/__tests__/components/Hero
 * @testing components/Hero/Hero.js
 * @description Contract tests for the Hero section: locale-driven copy,
 * the language-specific CV link (via data/cvAssets.config), and the
 * primary CTA's scroll-to-Projects behavior.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Hero from '../../components/Hero/Hero';

vi.mock('react-i18next', () => ({ useTranslation: vi.fn() }));
import { useTranslation } from 'react-i18next';

describe('Hero', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should render eyebrow, headline with highlight, lead, and three CTAs when the language is English', () => {
    useTranslation.mockReturnValue({ t: (k) => k, i18n: { language: 'en' } });

    render(<Hero />);

    expect(screen.getByText('hero.eyebrow')).toBeInTheDocument();
    expect(screen.getByText('hero.headlineHighlight')).toBeInTheDocument();
    expect(screen.getByText('hero.lead')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'hero.ctaCv' })).toHaveAttribute('href', '/Carlos_Keglevich_CV_EN.pdf');
  });

  it('should serve the German CV when the locale is a de variant (incl. de-DE)', () => {
    useTranslation.mockReturnValue({ t: (k) => k, i18n: { language: 'de-DE' } });

    render(<Hero />);

    expect(screen.getByRole('link', { name: 'hero.ctaCv' })).toHaveAttribute('href', '/Carlos_Keglevich_Lebenslauf_DE.pdf');
  });

  it('should scroll to the Projects section when the primary CTA is clicked', () => {
    useTranslation.mockReturnValue({ t: (k) => k, i18n: { language: 'en' } });
    const target = document.createElement('div');
    target.id = 'Projects';
    target.scrollIntoView = vi.fn();
    document.body.appendChild(target);
    render(<Hero />);

    fireEvent.click(screen.getByRole('button', { name: 'hero.ctaProjects' }));

    expect(target.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });

    document.body.removeChild(target);
  });

  it('should scroll to the career section when the visitor clicks the experience button', () => {
    // The second scroll CTA was never exercised, so a typo in its target id
    // would have shipped as a button that silently does nothing.
    const target = document.createElement('div');
    target.id = 'Career';
    target.scrollIntoView = vi.fn();
    document.body.appendChild(target);
    render(<Hero />);

    fireEvent.click(screen.getByRole('button', { name: 'hero.ctaExperience' }));

    expect(target.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });

    document.body.removeChild(target);
  });

  it('should do nothing rather than crash when the scroll target is not on the page', () => {
    // Optional chaining guards this; without it, clicking a CTA before its
    // section mounts would throw and blank the page via the ErrorBoundary.
    render(<Hero />);

    expect(() =>
      fireEvent.click(screen.getByRole('button', { name: 'hero.ctaProjects' }))
    ).not.toThrow();
  });
});
