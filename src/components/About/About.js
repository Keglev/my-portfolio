/**
 * @file About.js
 * @module components/About/About
 * @summary About section: profile photo, four storytelling blocks, and a
 * condensed career/education strip.
 * @enterprise Storytelling blocks are the career-changer pitch, in a fixed
 * order (BLOCKS) matching aboutSection.<key> in the locale files. The photo
 * prefers /profile.jpg (a curated public/ file, swappable without a
 * rebuild) and falls back to the bundled src/assets asset on load error, so
 * a missing public file never breaks the layout. Renders CareerStrip as its
 * final section.
 */
import React from 'react';
import './About.css';
import ProfilePicFallback from '../../assets/profile-pic.jpg';
import { useTranslation } from 'react-i18next';
import CareerStrip from './CareerStrip';

// Render order of the four storytelling blocks; keys map to aboutSection.<key> in the locales
const BLOCKS = ['block1', 'block2', 'block3', 'block4'];

/**
 * @returns {JSX.Element}
 */
const About = () => {
  const { t } = useTranslation();

  const handleImgError = (e) => {
    const img = e.currentTarget;
    if (img.getAttribute('data-fallback') !== '1') {
      img.setAttribute('data-fallback', '1');
      img.src = ProfilePicFallback;
    }
  };

  return (
    <div className="about-container" id="About">
      <div className="about-header">
        <img
          src="/profile.jpg"
          alt="Carlos Keglevich portrait"
          onError={handleImgError}
        />
        <h2>{t('aboutSection.heading')}</h2>
      </div>
      <div className="about-blocks">
        {BLOCKS.map((key) => (
          <article className="about-block" key={key}>
            <h3>{t(`aboutSection.${key}.title`)}</h3>
            <p>{t(`aboutSection.${key}.text`)}</p>
          </article>
        ))}
      </div>
      <CareerStrip />
    </div>
  );
};

export default About;
