/**
 * @file CareerStrip.js
 * @module components/About/CareerStrip
 * @summary Condensed career and education strip: one line per station, two columns.
 * @enterprise Replaces the former full Experience and Education sections.
 * The wrapper id "Career" is the scroll target of the Hero "Experience"
 * CTA. Rendered as About's final section, not standalone.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * @returns {JSX.Element}
 */
const CareerStrip = () => {
  const { t } = useTranslation();

  // i18next returns the key string when a list resource is missing; the guard
  // keeps the render safe in tests and in partially loaded locales
  const asList = (value) => (Array.isArray(value) ? value : []);
  const career = asList(t('aboutSection.career', { returnObjects: true }));
  const education = asList(t('aboutSection.educationItems', { returnObjects: true }));

  return (
    <div className="career-strip" id="Career">
      <div className="about-block career-card">
        <h3>{t('aboutSection.careerHeading')}</h3>
        <ul>
          {career.map((line, idx) => <li key={idx}>{line}</li>)}
        </ul>
      </div>
      <div className="about-block career-card">
        <h3>{t('aboutSection.educationHeading')}</h3>
        <ul>
          {education.map((line, idx) => <li key={idx}>{line}</li>)}
        </ul>
      </div>
    </div>
  );
};

export default CareerStrip;
