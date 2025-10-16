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
        }));
        try { console.debug('RepoDocs: enriched projectsWithDocs', enriched.map(e => ({ name: e.name, docsTitle: e.docsTitle }))); } catch (e) {}
        setProjectsWithDocs(enriched);
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
              <p className="date">{p.docsTitle || ''}</p>
              {(() => {
                const isGeneric = (s) => {
                  if (!s) return true;
                  const clean = String(s).toLowerCase();
                  // generic contribution/help placeholders or empty link text
                  return /for questions or contributions|open an issue|for questions|contribut/i.test(clean) || clean.trim().length < 20;
                };

                // prefer translated descriptions when available
                const pickDesc = () => {
                  try {
                    if (i18n && i18n.language === 'de') {
                      if (p.repoDocs && p.repoDocs.apiDocumentation && p.repoDocs.apiDocumentation.description_de && !isGeneric(p.repoDocs.apiDocumentation.description_de)) return p.repoDocs.apiDocumentation.description_de;
                      if (p.repoDocs && p.repoDocs.architectureOverview && p.repoDocs.architectureOverview.description_de && !isGeneric(p.repoDocs.architectureOverview.description_de)) return p.repoDocs.architectureOverview.description_de;
                      if (p.docs && p.docs.documentation && p.docs.documentation.description_de && !isGeneric(p.docs.documentation.description_de)) return p.docs.documentation.description_de;
                    }

                    if (p.repoDocs && p.repoDocs.apiDocumentation && p.repoDocs.apiDocumentation.description && !isGeneric(p.repoDocs.apiDocumentation.description)) return p.repoDocs.apiDocumentation.description;
                    if (p.repoDocs && p.repoDocs.architectureOverview && p.repoDocs.architectureOverview.description && !isGeneric(p.repoDocs.architectureOverview.description)) return p.repoDocs.architectureOverview.description;
                    if (p.docs && p.docs.documentation && p.docs.documentation.description && !isGeneric(p.docs.documentation.description)) return p.docs.documentation.description;
                  } catch (e) { /* ignore */ }
                  return null;
                };

                const desc = pickDesc();
                return <p>{desc || (p.summary || '')}</p>;
              })()}

              {/* Prefer structured repoDocs links when available */}
              {p.repoDocs && p.repoDocs.apiDocumentation && (
                <p><strong>{p.repoDocs.apiDocumentation.title}</strong>: <a href={p.repoDocs.apiDocumentation.link} target="_blank" rel="noopener noreferrer" className="project-link">{p.repoDocs.apiDocumentation.link}</a></p>
              )}
              {p.repoDocs && p.repoDocs.architectureOverview && (
                <p><strong>{p.repoDocs.architectureOverview.title}</strong>: <a href={p.repoDocs.architectureOverview.link} target="_blank" rel="noopener noreferrer" className="project-link">{p.repoDocs.architectureOverview.link}</a></p>
              )}

              {/* Legacy fallback: render legacy docsLink if nothing structured exists */}
              {!((p.repoDocs && (p.repoDocs.apiDocumentation || p.repoDocs.architectureOverview)) || (p.docs && p.docs.documentation)) && p.docsLink && (
                <p><a href={p.docsLink} target="_blank" rel="noopener noreferrer" className="project-link">{p.docsTitle || p.docsLink}</a></p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RepoDocs;
