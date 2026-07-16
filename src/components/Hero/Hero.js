import React from 'react';
import { useTranslation } from 'react-i18next';
import './Hero.css';

/**
 * Hero section: the first thing a recruiter sees.
 * A short eyebrow line (stack + location), a value-proposition headline with
 * an accented key phrase, a one-paragraph lead, and three CTAs (projects,
 * CV download, contact). All copy is locale-driven; the CV link serves the
 * matching language PDF, mirroring the sidebar logic.
 *
 * @returns {JSX.Element}
 */
const Hero = () => {
  const { t, i18n } = useTranslation();
  const isGerman = (i18n.language || 'en').toLowerCase().startsWith('de');
  const cvFile = isGerman
    ? '/Carlos_Keglevich_Lebenslauf_DE.pdf'
    : '/Carlos_Keglevich_CV_EN.pdf';

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <section className="hero" aria-label="Introduction">
      <p className="hero-eyebrow">{t('hero.eyebrow')}</p>
      <h1 className="hero-headline">
        {t('hero.headlinePre')}{' '}
        <span className="hero-highlight">{t('hero.headlineHighlight')}</span>
      </h1>
      <p className="hero-lead">{t('hero.lead')}</p>
      <div className="hero-cta">
        <button type="button" className="hero-btn primary" onClick={() => scrollTo('Projects')}>
          {t('hero.ctaProjects')}
        </button>
        <a className="hero-btn ghost" href={cvFile} download target="_blank" rel="noopener noreferrer">
          {t('hero.ctaCv')}
        </a>
        <button type="button" className="hero-btn ghost" onClick={() => scrollTo('Experience')}>
          {t('hero.ctaExperience')}
        </button>
      </div>
    </section>
  );
};

export default Hero;
