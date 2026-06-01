import React from 'react';
import { useTranslation } from 'react-i18next';
import './Experience.css';

/**
 * Displays a timeline of professional work experience.
 * Renders job titles, employment dates, and position summaries from i18n resources.
 *
 * @returns {JSX.Element} Experience section with a list of job cards.
 */
const Experience = () => {
  const { t } = useTranslation();
  /* Entries pulled from locales directory in the language selected by the user */
  const experiences = [
    {
      title: t('experienceSection.experience1.title'),
      date: t('experienceSection.experience1.date'),
      summary: t('experienceSection.experience1.summary'),
    },
    {
      title: t('experienceSection.experience2.title'),
      date: t('experienceSection.experience2.date'),
      summary: t('experienceSection.experience2.summary'),
    },
    {
      title: t('experienceSection.experience3.title'),
      date: t('experienceSection.experience3.date'),
      summary: t('experienceSection.experience3.summary'),
    },
    {
      title: t('experienceSection.experience4.title'),
      date: t('experienceSection.experience4.date'),
      summary: t('experienceSection.experience4.summary'),
    },
    {
      title: t('experienceSection.experience5.title'),
      date: t('experienceSection.experience5.date'),
      summary: t('experienceSection.experience5.summary'),
    },
    {
      title: t('experienceSection.experience6.title'),
      date: t('experienceSection.experience6.date'),
      summary: t('experienceSection.experience6.summary'),
    },
  ];

  return (
    <div className="experience-container" id="Experience">
      <h2>{t('experience.jobExperiences')}</h2>
      
      <div className="experience-list">
        {experiences.map((exp, index) => (
          <div className="experience-card" key={index}>
            <h3>{exp.title}</h3>
            <p className="date">{exp.date}</p>
            <p>{exp.summary}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Experience;
