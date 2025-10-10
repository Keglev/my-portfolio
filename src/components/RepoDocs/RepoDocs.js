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
        const filtered = data.filter(p => p.docsLink);
        setProjectsWithDocs(filtered);
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
                <h3>
                  <a href={p.docsLink} target="_blank" rel="noopener noreferrer" className="project-link">
                    {p.docsTitle || p.name}
                  </a>
                </h3>
                <p className="summary">{p.summary}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RepoDocs;
