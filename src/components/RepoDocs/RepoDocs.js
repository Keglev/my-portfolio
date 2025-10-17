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
          // prefer de title if present
          if (p.docsTitle_de && !bad(p.docsTitle_de)) return p.docsTitle_de;
          // prefer structured repoDocs api title
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
            (p.repoDocs && ((p.repoDocs.apiDocumentation && p.repoDocs.apiDocumentation.link) || (p.repoDocs.architectureOverview && p.repoDocs.architectureOverview.link))) ||
            (p.docs && ((p.docs.apiDocumentation && p.docs.apiDocumentation.link) || (p.docs.documentation && p.docs.documentation.link))) ||
            p.docsLink
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
              {/* Prefer structured docs descriptions; do not fall back to README 'about' summaries here */}
              {(() => {
                const isGeneric = (s) => {
                  if (!s) return true;
                  const clean = String(s).toLowerCase();
                  return /for questions or contributions|open an issue|for questions|contribut/i.test(clean) || clean.trim().length < 20;
                };
                try {
                  if (i18n && i18n.language === 'de') {
                    if (p.repoDocs && p.repoDocs.apiDocumentation && p.repoDocs.apiDocumentation.description_de && !isGeneric(p.repoDocs.apiDocumentation.description_de)) return <p>{p.repoDocs.apiDocumentation.description_de}</p>;
                    if (p.repoDocs && p.repoDocs.architectureOverview && p.repoDocs.architectureOverview.description_de && !isGeneric(p.repoDocs.architectureOverview.description_de)) return <p>{p.repoDocs.architectureOverview.description_de}</p>;
                    if (p.docs && p.docs.documentation && p.docs.documentation.description_de && !isGeneric(p.docs.documentation.description_de)) return <p>{p.docs.documentation.description_de}</p>;
                  }
                  if (p.repoDocs && p.repoDocs.apiDocumentation && p.repoDocs.apiDocumentation.description && !isGeneric(p.repoDocs.apiDocumentation.description)) return <p>{p.repoDocs.apiDocumentation.description}</p>;
                  if (p.repoDocs && p.repoDocs.architectureOverview && p.repoDocs.architectureOverview.description && !isGeneric(p.repoDocs.architectureOverview.description)) return <p>{p.repoDocs.architectureOverview.description}</p>;
                  if (p.docs && p.docs.documentation && p.docs.documentation.description && !isGeneric(p.docs.documentation.description)) return <p>{p.docs.documentation.description}</p>;
                } catch (e) { /* ignore */ }
                return null;
              })()}

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

                const linkLabel = (i18n && i18n.language === 'de') ? 'Hier öffnen' : t('viewDocs');

                const nodes = [];
                if (p.repoDocs && p.repoDocs.apiDocumentation && p.repoDocs.apiDocumentation.link) {
                  nodes.push(
                    <p key="api"><strong>{p.repoDocs.apiDocumentation.title}</strong>: <a href={convertRawToBlob(p.repoDocs.apiDocumentation.link)} target="_blank" rel="noopener noreferrer" className="project-link">{linkLabel}</a></p>
                  );
                }
                if (p.repoDocs && p.repoDocs.architectureOverview && p.repoDocs.architectureOverview.link) {
                  nodes.push(
                    <p key="arch"><strong>{p.repoDocs.architectureOverview.title}</strong>: <a href={convertRawToBlob(p.repoDocs.architectureOverview.link)} target="_blank" rel="noopener noreferrer" className="project-link">{linkLabel}</a></p>
                  );
                }
                return nodes;
              })()}

              {/* Legacy fallback: render legacy docsLink if nothing structured exists */}
              {!((p.repoDocs && (p.repoDocs.apiDocumentation || p.repoDocs.architectureOverview)) || (p.docs && p.docs.documentation)) && p.docsLink && (
                <p><a href={(p.docsLink && p.docsLink.includes('raw.githubusercontent.com')) ? p.docsLink.replace(/^https:\/\/raw\.githubusercontent\.com\//i, 'https://github.com/').replace(/\/([^/]+)\/([^/]+)\/(.+)$/, '/blob/$1/$2/$3') : p.docsLink} target="_blank" rel="noopener noreferrer" className="project-link">{(i18n && i18n.language === 'de') ? 'Hier öffnen' : t('viewDocs')}</a></p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RepoDocs;
