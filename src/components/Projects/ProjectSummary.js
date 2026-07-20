/**
 * @file ProjectSummary.js
 * @module components/Projects/ProjectSummary
 * @summary Renders the descriptive summary for a curated project card.
 * @enterprise Both summaryEn and summaryDe are always present in the
 * config, so language selection is a straightforward switch with no
 * missing-translation fallback. Receives the raw i18n.language from
 * ProjectCard and re-derives its own German check via strict equality --
 * see the duplication note in ProjectCard.js's header.
 */
import React from 'react';

/**
 * @param {Object} project - Curated project data (ProjectConfig shape from src/data/projects.config)
 * @param {string} language - Active i18n locale code (e.g. 'en', 'de')
 * @returns {JSX.Element}
 */
const ProjectSummary = ({ project, language }) => {
  const isGerman = language === 'de';
  const text = isGerman ? project.summaryDe : project.summaryEn;
  return <p>{text}</p>;
};

export default ProjectSummary;
