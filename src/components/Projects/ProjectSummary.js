import React from 'react';
import { getAboutSection } from './projectsUtils';

/**
 * Renders the descriptive summary for a single project card.
 * Selects the best available text in priority order: German translation >
 * README About section > default summary. Falls back to a skeleton placeholder
 * while content is unavailable.
 *
 * @param {object} project - Project data object
 * @param {string} language - Active i18n locale code (e.g. 'en', 'de')
 * @param {Function} t - i18next translation function
 * @returns {JSX.Element}
 */
const ProjectSummary = ({ project, language, t }) => {
  const about = getAboutSection(project.object?.text);
  const isGerman = language === 'de';
  // Priority: explicit German summary > README About text > generic summary
  const displaySummary = (isGerman && project.summary_de) ? project.summary_de : (about || project.summary);

  if (!displaySummary?.trim()) {
    return <div data-testid="project-summary-skeleton" className="skeleton-description short skeleton" style={{ width: '60%' }} />;
  }

  return (
    <p>
      {displaySummary}
      {isGerman && !project.summary_de && (
        <span style={{ fontStyle: 'italic', marginLeft: '8px', color: '#666', fontSize: '0.9em' }}>
          ({t('translationMissing') || 'Übersetzung fehlt'})
        </span>
      )}
    </p>
  );
};

export default ProjectSummary;
