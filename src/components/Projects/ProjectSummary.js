import React from 'react';

/**
 * Renders the descriptive summary for a curated project card.
 * Both summaryEn and summaryDe are always present in the config, so language
 * selection is a straightforward switch with no missing-translation fallback.
 *
 * @param {import('../../data/projects.config').ProjectConfig} project - Curated project data
 * @param {string} language - Active i18n locale code (e.g. 'en', 'de')
 * @returns {JSX.Element}
 */
const ProjectSummary = ({ project, language }) => {
  const isGerman = language === 'de';
  const text = isGerman ? project.summaryDe : project.summaryEn;
  return <p>{text}</p>;
};

export default ProjectSummary;
