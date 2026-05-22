import React from 'react';
import { useTranslation } from 'react-i18next';
import './Education.css';

const Education = () => {
  const { t } = useTranslation();

  const entries = [
    {
      title: t('educationSection.entry1.title'),
      institution: t('educationSection.entry1.institution'),
      note: t('educationSection.entry1.note'),
    },
    {
      title: t('educationSection.entry2.title'),
      institution: t('educationSection.entry2.institution'),
      note: t('educationSection.entry2.note'),
    },
    {
      title: t('educationSection.entry3.title'),
      institution: t('educationSection.entry3.institution'),
      note: t('educationSection.entry3.note'),
    },
    {
      title: t('educationSection.entry4.title'),
      institution: t('educationSection.entry4.institution'),
      note: t('educationSection.entry4.note'),
    },
  ];

  return (
    <div className="education-container" id="Education">
      <h2>{t('educationSection.heading')}</h2>
      <div className="education-list">
        {entries.map((entry, index) => (
          <div className="education-card" key={index}>
            <h3>{entry.title}</h3>
            {entry.institution && (
              <p className="education-institution">{entry.institution}</p>
            )}
            {entry.note && (
              <p className="education-note">{entry.note}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Education;
