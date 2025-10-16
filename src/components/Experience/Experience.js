import React from 'react';
import { useTranslation } from 'react-i18next'; // Importing translation hook
import './Experience.css'; // Importing the CSS file for styling

/**
 * The Experience component displays a list of professional experiences,
 * including the title, date, and a brief summary of each position.
 */
const Experience = () => {
  // Array containing experience data
  const { t } = useTranslation(); // Initialize translation hook
  // used text from locales directory according to selected language
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
      {/* Heading for the experience section */}
      <h2>{t('experience')}</h2>
      
      {/* Mapping through the experiences array and displaying each one */}
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
