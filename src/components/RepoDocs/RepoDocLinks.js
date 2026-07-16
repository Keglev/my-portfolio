import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Renders the curated documentation links for a single project as a compact
 * two-column grid of bordered rows. Each row shows a small decorative glyph
 * (aria-hidden, so the accessible name stays the localized label) and the
 * localized link label from the config.
 *
 * @param {Object[]} links - Curated doc links (RepoDocLink shape from src/data/repoDocs.config)
 * @returns {JSX.Element}
 */
const RepoDocLinks = ({ links = [] }) => {
  const { i18n } = useTranslation();
  const isGerman = (i18n.language || 'en').toLowerCase().startsWith('de');

  return (
    <ul className="repo-docs-links">
      {links.map((link, idx) => (
        <li key={idx}>
          <a href={link.url} target="_blank" rel="noopener noreferrer" className="repo-doc-link">
            <span className="repo-doc-icon" aria-hidden="true">{link.icon || '❯'}</span>
            <span>{isGerman ? link.titleDe : link.titleEn}</span>
          </a>
        </li>
      ))}
    </ul>
  );
};

export default RepoDocLinks;
