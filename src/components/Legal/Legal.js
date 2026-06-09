import React from 'react';
import { useTranslation } from 'react-i18next';
import './Legal.css';

/**
 * Renders the German legal pages: Impressum and Datenschutzerklärung.
 * Both sections reuse the project-card layout for visual consistency with the rest of the site.
 *
 * @returns {JSX.Element} Fragment containing Impressum and Datenschutz sections.
 */
const Legal = () => {
  const { t } = useTranslation();
  return (
    <>
      <div className="project-container" id="Impressum">
        <h2>{t('legal.impressumHeading')}</h2>
        <div className="project-grid">
          <div className="project-card visible">
            <div className="project-content legal-content">
              {/* Legal text contains links and line-break tags authored in the locale files */}
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
              {/* Legal text contains links and line-break tags authored in the locale files */}
              <div dangerouslySetInnerHTML={{ __html: t('legal.datenschutzContent') }} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Legal;
