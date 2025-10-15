import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import './RepoDocs.css';

const RepoDocs = () => {
  const { t } = useTranslation();
  const [projectsWithDocs, setProjectsWithDocs] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        // Try runtime pinned fetch first
        let runtime = [];
        try {
          const { fetchPinnedRepositories } = await import('../../utils/githubApi');
          runtime = await fetchPinnedRepositories();
        } catch (e) { runtime = []; }

        if (!runtime || runtime.length === 0) {
          const res = await fetch('/projects.json');
          if (!res.ok) return setProjectsWithDocs([]);
          const data = await res.json();
          const enriched = data.map(p => ({
            name: p.name,
            docs: p.docs || null,
            docsLink: p.docsLink || null,
            docsTitle: p.docsTitle_de || p.docsTitle || null,
            summary: p.summary_de || p.summary || '',
          }));
          setProjectsWithDocs(enriched);
          return;
        }

        // Enrich runtime results by fetching README to parse docs links if missing
        const enriched = await Promise.all(runtime.map(async (p) => {
          const repo = { name: p.name, docs: p.docs || null, docsLink: p.docsLink || null, docsTitle: p.docsTitle_de || p.docsTitle || null, summary: p.summary_de || p.summary || '' };
          try {
            const r = await fetch(`https://raw.githubusercontent.com/keglev/${p.name}/main/README.md`);
            if (r.ok) {
              const txt = await r.text();
              if (!repo.docsLink) {
                const m = txt.match(/\[([^\]]*doc[^\]]*)\]\((https?:\/\/[^)\s]+)\)/i);
                if (m) { repo.docsTitle = m[1]; repo.docsLink = m[2]; }
              }
              repo.summary = repo.summary || (txt.split(/\n\s*\n/).map(s=>s.trim()).filter(Boolean)[0] || '');
            }
          } catch (e) {}
          return repo;
        }));
        setProjectsWithDocs(enriched);
      } catch (e) {
        setProjectsWithDocs([]);
      }
    };
    load();
  }, []);

  // Render with same container and card styles as Projects so visuals match
  return (
    <div className="project-container" id="RepoDocs">
      <h2>{t('repoDocs')}</h2>

      <div className="project-grid">
        {projectsWithDocs.length === 0 ? (
            <div className="project-card visible">
              <div className="project-content">
                <p>{t('noRepoDocs')}</p>
              </div>
            </div>
          ) : (
            projectsWithDocs.map((p, idx) => (
              <div className="project-card visible" key={idx}>
                <div className="image-wrap" style={{ display: 'none' }} />
                <div className="project-content">
                  <h3>{p.name}</h3>
                  {/* Documentation section */}
                  {p.docs && p.docs.documentation ? (
                    <div className="docs-block">
                      <h4>{p.docs.documentation.title}</h4>
                      <p className="summary">{p.docs.documentation.description}</p>
                      <a href={p.docs.documentation.link} target="_blank" rel="noopener noreferrer" className="project-link">{p.docs.documentation.link}</a>
                    </div>
                  ) : (
                    <div className="docs-block">
                      <p>{t('noRepoDocs')}</p>
                    </div>
                  )}
                  {/* API Documentation section */}
                  {p.docs && p.docs.apiDocumentation ? (
                    <div className="docs-block">
                      <h4>{p.docs.apiDocumentation.title}</h4>
                      <p className="summary">{p.docs.apiDocumentation.description}</p>
                      <a href={p.docs.apiDocumentation.link} target="_blank" rel="noopener noreferrer" className="project-link">{p.docs.apiDocumentation.link}</a>
                    </div>
                  ) : null}
                </div>
              </div>
            ))
          )}
      </div>
    </div>
  );
};

export default RepoDocs;
