import React from 'react';
import { useTranslation } from 'react-i18next';
import { convertRawToBlob } from '../Projects/projectsUtils';

const DocLink = ({ href, label }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" className="project-link">
    {label}
  </a>
);

/**
 * Renders documentation links for a single project in the RepoDocs section.
 * Checks fields in priority order: placeholder → API docs → architecture overview →
 * production URL → test coverage → generic docsLink fallback.
 *
 * @param {object} project - Enriched project object from useRepoDocs
 * @returns {JSX.Element}
 */
const RepoDocLinks = ({ project: p }) => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const linkLabel = t('viewDocs');

  if (p.repoDocs?.placeholder) {
    const title = (lang === 'de' && p.repoDocs.placeholder.title_de)
      ? p.repoDocs.placeholder.title_de
      : p.repoDocs.placeholder.title;
    const desc = (lang === 'de' && p.repoDocs.placeholder.description_de)
      ? p.repoDocs.placeholder.description_de
      : p.repoDocs.placeholder.description;
    return <p style={{ fontStyle: 'italic', color: '#888' }}><strong>{title}</strong> — {desc}</p>;
  }

  const nodes = [];

  if (p.repoDocs?.apiDocumentation?.link) {
    const title = (lang === 'de' && p.repoDocs.apiDocumentation.title_de)
      ? p.repoDocs.apiDocumentation.title_de
      : p.repoDocs.apiDocumentation.title;
    nodes.push(
      <p key="api"><strong>{title}</strong>: <DocLink href={convertRawToBlob(p.repoDocs.apiDocumentation.link)} label={linkLabel} /></p>
    );
  }

  if (p.repoDocs?.architectureOverview?.link) {
    const title = (lang === 'de' && p.repoDocs.architectureOverview.title_de)
      ? p.repoDocs.architectureOverview.title_de
      : p.repoDocs.architectureOverview.title;
    nodes.push(
      <p key="arch"><strong>{title}</strong>: <DocLink href={convertRawToBlob(p.repoDocs.architectureOverview.link)} label={linkLabel} /></p>
    );
  }

  if (p.repoDocs?.productionUrl?.link) {
    const title = (lang === 'de' && p.repoDocs.productionUrl.title_de)
      ? p.repoDocs.productionUrl.title_de
      : p.repoDocs.productionUrl.title;
    nodes.push(
      <p key="url"><strong>{title}</strong>: <DocLink href={convertRawToBlob(p.repoDocs.productionUrl.link)} label={t('urlLabel')} /></p>
    );
  }

  if (Array.isArray(p.repoDocs?.testing?.coverage)) {
    p.repoDocs.testing.coverage.forEach((cov, idx) => {
      const title = (lang === 'de' && cov.title_de) ? cov.title_de : cov.title;
      nodes.push(
        <p key={`cov-${idx}`}><strong>{title}</strong>: <DocLink href={convertRawToBlob(cov.link)} label={linkLabel} /></p>
      );
    });
  }

  // Only fall back to the generic docsLink when no structured doc fields exist
  const hasStructuredLinks = !!(p.repoDocs?.apiDocumentation || p.repoDocs?.architectureOverview || p.docs?.documentation);
  if (!hasStructuredLinks && p.docsLink) {
    return <p><DocLink href={convertRawToBlob(p.docsLink)} label={t('viewDocs')} /></p>;
  }

  return <>{nodes}</>;
};

export default RepoDocLinks;
