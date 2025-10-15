import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import './RepoDocs.css';

const RepoDocs = () => {
  const { t } = useTranslation();
  const [projectsWithDocs, setProjectsWithDocs] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
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
              <p className="date">{p.docs && p.docs.documentation ? p.docs.documentation.title : (p.docsLink || '')}</p>
              <p>{p.docs && p.docs.documentation ? p.docs.documentation.description : (p.summary || '')}</p>
              {p.docs && p.docs.documentation && (
                <p><a href={p.docs.documentation.link} target="_blank" rel="noopener noreferrer" className="project-link">{p.docs.documentation.link}</a></p>
              )}
              {/* Fallback: if we only have a legacy docsLink (from projects.json) render it as a clickable link */}
              {(!p.docs || !p.docs.documentation) && p.docsLink && (
                <p><a href={p.docsLink} target="_blank" rel="noopener noreferrer" className="project-link">{p.docsTitle || p.docsLink}</a></p>
              )}
              {p.docs && p.docs.apiDocumentation && (
                <p><strong>{p.docs.apiDocumentation.title}</strong>: <a href={p.docs.apiDocumentation.link} target="_blank" rel="noopener noreferrer" className="project-link">{p.docs.apiDocumentation.link}</a></p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RepoDocs;
