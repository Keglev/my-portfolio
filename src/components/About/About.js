import React from 'react';
import './About.css';
import ProfilePicFallback from '../../assets/profile-pic.jpg';
import { useTranslation } from 'react-i18next';
import CareerStrip from './CareerStrip';

// Render order of the four storytelling blocks; keys map to aboutSection.<key> in the locales
const BLOCKS = ['block1', 'block2', 'block3', 'block4'];

/**
 * About section: four storytelling blocks (career-changer pitch), a condensed
 * career/education strip, and the profile photo.
 * The photo prefers the curated file at public/profile.jpg and falls back to
 * the bundled asset on load error, so a missing file never breaks the layout.
 *
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
      <div className="content">
        <h2>{t('aboutSection.heading')}</h2>
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
      <div className="profile">
        <img
          src="/profile.jpg"
          alt="Carlos Keglevich portrait"
          onError={handleImgError}
        />
      </div>
    </div>
  );
};

export default About;
