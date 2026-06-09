import React from 'react';
import { useTranslation } from 'react-i18next';
import useRepoDocs from './useRepoDocs';
import RepoDocLinks from './RepoDocLinks';
import './RepoDocs.css';

/**
 * Renders the RepoDocs section listing projects that have linked documentation.
 * Shows an empty-state card when no projects with docs are found.
 *
 * @returns {JSX.Element}
 */
const RepoDocs = () => {
  const { t } = useTranslation();
  const projectsWithDocs = useRepoDocs();

  return (
    <div className="repo-docs-container" id="RepoDocs">
      <h2>{t('repoDocs')}</h2>
      <div className="repo-docs-list">
        {projectsWithDocs.length === 0 ? (
          <div className="repo-docs-card">
            <p>{t('noRepoDocs')}</p>
          </div>
        ) : (
          projectsWithDocs.map((p, idx) => (
            <div className="repo-docs-card" key={idx}>
              <h3>{p.name}</h3>
              <RepoDocLinks project={p} />
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RepoDocs;
