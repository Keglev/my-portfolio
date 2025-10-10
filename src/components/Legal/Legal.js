import React from 'react';
import { useTranslation } from 'react-i18next';
import './Legal.css';

const Legal = () => {
  const { t } = useTranslation();
  // Provide localizable content; for now use the long German text provided in the user message and an English fallback from locale files
  return (
    <div className="project-container" id="Legal">
      <h2>{t('legal.heading')}</h2>
      <div className="project-grid">
        <div className="project-card visible">
          <div className="project-content legal-content">
            <div dangerouslySetInnerHTML={{ __html: t('legal.content_html') }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Legal;
