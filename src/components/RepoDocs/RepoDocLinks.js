import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Renders the curated documentation links for a single project as a stacked
 * list. Each link's label is localized (English/German) from the config; the
 * label text itself is the clickable link.
 *
 * @param {Object[]} links - Curated doc links (RepoDocLink shape from src/data/repoDocs.config)
 * @returns {JSX.Element}
 */
const RepoDocLinks = ({ links = [] }) => {
  const { i18n } = useTranslation();
  const isGerman = (i18n.language || 'en').toLowerCase().startsWith('de');

  return (
    <div className="repo-docs-links">
      {links.map((link, idx) => (
        <a
          key={idx}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="project-link"
        >
          {isGerman ? link.titleDe : link.titleEn}
        </a>
      ))}
    </div>
  );
};

export default RepoDocLinks;
