import React from 'react';
import { useTranslation } from 'react-i18next';
import repoDocs from '../../data/repoDocs.config';
import RepoDocLinks from './RepoDocLinks';
import './RepoDocs.css';

/**
 * Renders the "Project documentation" section from the curated repoDocs config.
 * No runtime fetch: link content, titles and order are controlled in
 * src/data/repoDocs.config. Shows an empty-state card only if the config is empty.
 *
 * @returns {JSX.Element}
 */
const RepoDocs = () => {
  const { t } = useTranslation();

  return (
    <div className="repo-docs-container" id="RepoDocs">
      <h2>{t('repoDocs')}</h2>
      <div className="repo-docs-list">
        {repoDocs.length === 0 ? (
          <div className="repo-docs-card">
            <p>{t('noRepoDocs')}</p>
          </div>
        ) : (
          repoDocs.map((project) => (
            <div className="repo-docs-card" key={project.slug}>
              <h3>{project.displayName}</h3>
              <RepoDocLinks links={project.links} />
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RepoDocs;
