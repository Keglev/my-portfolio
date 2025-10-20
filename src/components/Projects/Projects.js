import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import ProjectCard from './ProjectCard';
import { getPrimaryImage } from './projectsUtils';
import './Projects.css';

// We intentionally do NOT require a build-time JSON file here because during
// the production build that file may not exist and webpack would fail.
// The pipeline writes `public/projects.json` which we fetch at runtime below.
let ProjectsData = [];

/**
 * Projects component
 * Renders a grid of ProjectCard components using pre-built data (deployed_projects.json).
 */
const Projects = () => {
  const { t } = useTranslation();
  const [projects, setProjects] = useState(() => ProjectsData || []);
  // track loaded state per project so ProjectCard can toggle the `.visible` class
  const [loadedImages, setLoadedImages] = useState({});

  // If build-time `deployed_projects.json` is empty, try to fetch the runtime
  // `public/projects.json` as a fallback so the Projects list renders during dev.
  useEffect(() => {
    if (projects && projects.length > 0) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/projects.json');
        if (!res.ok) return;
        const json = await res.json();
        if (!cancelled && Array.isArray(json) && json.length > 0) setProjects(json);
      } catch (e) {
        // ignore fetch errors
      }
    })();
    return () => { cancelled = true; };
  }, [projects]);

  return (
    <section className="project-container" id="Projects">
      <h2>{t('projects', 'Projects')}</h2>
      <div className="project-grid">
        {projects.map((p, idx) => (
          <ProjectCard
            key={p.name || idx}
            project={p}
            image={getPrimaryImage(p)}
            index={idx}
            loadedImages={loadedImages}
            setLoadedImages={setLoadedImages}
          />
        ))}
      </div>
    </section>
  );
};

export default Projects;
