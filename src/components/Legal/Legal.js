import React from 'react';
import { useTranslation } from 'react-i18next';
import './Legal.css';

const Legal = () => {
  const { t } = useTranslation();
  return (
    <>
      <div className="project-container" id="Impressum">
        <h2>{t('legal.impressumHeading')}</h2>
        <div className="project-grid">
          <div className="project-card visible">
            <div className="project-content legal-content">
              <div dangerouslySetInnerHTML={{ __html: t('legal.impressumContent') }} />
            </div>
          </div>
        </div>
      </div>

      <div className="project-container" id="Datenschutz">
        <h2>{t('legal.datenschutzHeading')}</h2>
        <div className="project-grid">
          <div className="project-card visible">
            <div className="project-content legal-content">
              <div dangerouslySetInnerHTML={{ __html: t('legal.datenschutzContent') }} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Legal;
