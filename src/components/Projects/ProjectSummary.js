import React from 'react';
import { getAboutSection } from './projectsUtils';

const ProjectSummary = ({ project, language, t }) => {
  const about = getAboutSection(project.object?.text);
  const isGerman = language === 'de';
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
