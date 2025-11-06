import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import './RepoDocs.css';

const RepoDocs = () => {
  const { t, i18n } = useTranslation();
  const [projectsWithDocs, setProjectsWithDocs] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/projects.json');
        if (!res.ok) return setProjectsWithDocs([]);
        const data = await res.json();
        // Debug: log the fetched projects for runtime inspection
        try { console.debug('RepoDocs: fetched /projects.json', data); } catch (e) {}
        const safeTitle = (p) => {
          const bad = (s) => !s || /open an issue|question|contribut/i.test(String(s).toLowerCase());
          // prefer explicit German translation fields when the parser provided them
          if (p.repoDocs && p.repoDocs.apiDocumentation && p.repoDocs.apiDocumentation.title_de && !bad(p.repoDocs.apiDocumentation.title_de)) return p.repoDocs.apiDocumentation.title_de;
          if (p.repoDocs && p.repoDocs.architectureOverview && p.repoDocs.architectureOverview.title_de && !bad(p.repoDocs.architectureOverview.title_de)) return p.repoDocs.architectureOverview.title_de;
          if (p.docsTitle_de && !bad(p.docsTitle_de)) return p.docsTitle_de;
          // fall back to structured titles
          if (p.repoDocs && p.repoDocs.apiDocumentation && p.repoDocs.apiDocumentation.title && !bad(p.repoDocs.apiDocumentation.title)) return p.repoDocs.apiDocumentation.title;
          if (p.repoDocs && p.repoDocs.architectureOverview && p.repoDocs.architectureOverview.title && !bad(p.repoDocs.architectureOverview.title)) return p.repoDocs.architectureOverview.title;
          if (p.docs && p.docs.documentation && p.docs.documentation.title && !bad(p.docs.documentation.title)) return p.docs.documentation.title;
          if (p.docsTitle && !bad(p.docsTitle)) return p.docsTitle;
          return null;
        };
        const enriched = data.map(p => ({
          name: p.name,
          docs: p.docs || null,
          repoDocs: p.repoDocs || null,
          docsLink: p.docsLink || null,
          docsTitle: safeTitle(p),
          summary: p.summary_de || p.summary || '',
          // mark if this repo actually has docs we should surface
          hasDocs: !!(
            (p.repoDocs && p.repoDocs.placeholder) || // always show "Under Construction" when present
            (p.repoDocs && ((p.repoDocs.apiDocumentation && p.repoDocs.apiDocumentation.link) || (p.repoDocs.architectureOverview && p.repoDocs.architectureOverview.link) || (p.repoDocs.testing && p.repoDocs.testing.coverage && p.repoDocs.testing.coverage.length > 0))) ||
            (p.docs && ((p.docs.apiDocumentation && p.docs.apiDocumentation.link) || (p.docs.documentation && p.docs.documentation.link))) ||
            p.docsLink ||
            // If parser left an AST, look for headings that indicate documentation sections
            (p._ast && Array.isArray(p._ast.children) && p._ast.children.some(c => c && c.type === 'heading' && c.children && c.children.length && /doc|api|architectur/i.test(String((c.children[0] && c.children[0].value) || '')))) ||
            // fallback: text contains documentation keywords
            (p.text && /documentation|api documentation|architecture|api integration/i.test(p.text))
          ),
        }));
        // only keep entries that actually have docs (do not show about/summary-only repos)
        const filtered = enriched.filter(e => e.hasDocs);
  try { console.debug('RepoDocs: enriched projectsWithDocs', filtered.map(e => ({ name: e.name, docsTitle: e.docsTitle }))); } catch (e) {}
  setProjectsWithDocs(filtered);
      } catch (e) {
        setProjectsWithDocs([]);
      }
    };
    load();
  }, []);

  // Render horizontally like Experience cards (compact list)
  return (
    <div className="experience-container" id="RepoDocs">
      <h2>{t('repoDocs')}</h2>

      <div className="experience-list">
        {projectsWithDocs.length === 0 ? (
          <div className="experience-card">
            <p>{t('noRepoDocs')}</p>
          </div>
        ) : (
          projectsWithDocs.map((p, idx) => (
            <div className="experience-card" key={idx}>
              <h3>{p.name}</h3>
              {/* legacy small title removed: we show descriptions and structured links only */}
              {/* descriptions removed per UI requirement (small line under project title) */}

              {/* Prefer structured repoDocs links when available */}
              {(() => {
                const convertRawToBlob = (link) => {
                  if (!link) return link;
                  try {
                    const m = link.match(/^https:\/\/raw\.githubusercontent\.com\/([^/]+)\/([^/]+)\/([^/]+)\/(.+)$/i);
                    if (m) {
                      const user = m[1];
                      const repo = m[2];
                      const branch = m[3];
                      const path = m[4];
                      return `https://github.com/${user}/${repo}/blob/${branch}/${path}`;
                    }
                  } catch (e) { /* ignore */ }
                  return link;
                };

                const linkLabel = t('viewDocs');

                // Check if this project has the "Under Construction" placeholder
                if (p.repoDocs && p.repoDocs.placeholder) {
                  const placeholderText = (i18n && i18n.language === 'de' && p.repoDocs.placeholder.title_de) 
                    ? p.repoDocs.placeholder.title_de 
                    : p.repoDocs.placeholder.title;
                  const placeholderDesc = (i18n && i18n.language === 'de' && p.repoDocs.placeholder.description_de)
                    ? p.repoDocs.placeholder.description_de
                    : p.repoDocs.placeholder.description;
                  return (
                    <p key="placeholder" style={{ fontStyle: 'italic', color: '#888' }}>
                      <strong>{placeholderText}</strong> — {placeholderDesc}
                    </p>
                  );
                }

                const nodes = [];
                if (p.repoDocs && p.repoDocs.apiDocumentation && p.repoDocs.apiDocumentation.link) {
                  nodes.push(
                    <p key="api"><strong>{(i18n && i18n.language === 'de' && p.repoDocs.apiDocumentation && p.repoDocs.apiDocumentation.title_de) ? p.repoDocs.apiDocumentation.title_de : p.repoDocs.apiDocumentation.title}</strong>: <a href={convertRawToBlob(p.repoDocs.apiDocumentation.link)} target="_blank" rel="noopener noreferrer" className="project-link">{linkLabel}</a></p>
                  );
                }
                if (p.repoDocs && p.repoDocs.architectureOverview && p.repoDocs.architectureOverview.link) {
                  nodes.push(
                    <p key="arch"><strong>{(i18n && i18n.language === 'de' && p.repoDocs.architectureOverview && p.repoDocs.architectureOverview.title_de) ? p.repoDocs.architectureOverview.title_de : p.repoDocs.architectureOverview.title}</strong>: <a href={convertRawToBlob(p.repoDocs.architectureOverview.link)} target="_blank" rel="noopener noreferrer" className="project-link">{linkLabel}</a></p>
                  );
                }
                // Production URL (rendered as short "URL" link in the card)
                if (p.repoDocs && p.repoDocs.productionUrl && p.repoDocs.productionUrl.link) {
                  nodes.push(
                    <p key="url"><strong>{(i18n && i18n.language === 'de' && p.repoDocs.productionUrl && p.repoDocs.productionUrl.title_de) ? p.repoDocs.productionUrl.title_de : p.repoDocs.productionUrl.title}</strong>: <a href={convertRawToBlob(p.repoDocs.productionUrl.link)} target="_blank" rel="noopener noreferrer" className="project-link">{t('urlLabel')}</a></p>
                  );
                }
                // Handle multiple Test Coverage links (array format)
                if (p.repoDocs && p.repoDocs.testing && p.repoDocs.testing.coverage && Array.isArray(p.repoDocs.testing.coverage)) {
                  p.repoDocs.testing.coverage.forEach((cov, covIdx) => {
                    nodes.push(
                      <p key={`cov-${covIdx}`}><strong>{(i18n && i18n.language === 'de' && cov.title_de) ? cov.title_de : cov.title}</strong>: <a href={convertRawToBlob(cov.link)} target="_blank" rel="noopener noreferrer" className="project-link">{linkLabel}</a></p>
                    );
                  });
                }
                return nodes;
              })()}

              {/* Legacy fallback: render legacy docsLink if nothing structured exists */}
              {!((p.repoDocs && (p.repoDocs.apiDocumentation || p.repoDocs.architectureOverview)) || (p.docs && p.docs.documentation)) && p.docsLink && (
                <p><a href={(p.docsLink && p.docsLink.includes('raw.githubusercontent.com')) ? p.docsLink.replace(/^https:\/\/raw\.githubusercontent\.com\//i, 'https://github.com/').replace(/\/([^/]+)\/([^/]+)\/(.+)$/, '/blob/$1/$2/$3') : p.docsLink} target="_blank" rel="noopener noreferrer" className="project-link">{t('viewDocs')}</a></p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RepoDocs;
