/**
 * @file Hero.js
 * @module components/Hero/Hero
 * @summary Hero section: the first thing a recruiter sees.
 * @enterprise A short eyebrow line (stack + location), a value-proposition
 * headline with an accented key phrase, a one-paragraph lead, and three
 * CTAs (projects, CV download, career strip). All copy is locale-driven;
 * the CV link's file comes from data/cvAssets.config, the same single
 * source of truth SidebarMenu uses.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { getCvFile } from '../../data/cvAssets.config';
import './Hero.css';

/**
 * @returns {JSX.Element}
 */
const Hero = () => {
  const { t, i18n } = useTranslation();
  const cvFile = getCvFile(i18n.language);

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
        <button type="button" className="hero-btn ghost" onClick={() => scrollTo('Projects')}>
          {t('hero.ctaProjects')}
        </button>
        <a className="hero-btn ghost" href={cvFile} download target="_blank" rel="noopener noreferrer">
          {t('hero.ctaCv')}
        </a>
        <button type="button" className="hero-btn ghost" onClick={() => scrollTo('Career')}>
          {t('hero.ctaExperience')}
        </button>
      </div>
    </section>
  );
};

export default Hero;
