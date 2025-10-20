import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import ProjectCard from './ProjectCard';
import { getPrimaryImage } from './projectsUtils';
import './Projects.css';

// deployed_projects.json lives at repo root (produced at build-time). In Jest/CRA tests
// it may not be resolvable, so require it in a try/catch and fall back to an empty list.
let ProjectsData = [];
try {
  // eslint-disable-next-line global-require
  ProjectsData = require('../../deployed_projects.json');
} catch (e) {
  ProjectsData = [];
}

/**
 * Projects component
 * Renders a grid of ProjectCard components using pre-built data (deployed_projects.json).
 */
const Projects = () => {
  const { t } = useTranslation();
  const [projects, setProjects] = useState(() => ProjectsData || []);

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
    <section className="projects" id="Projects">
      <h2>{t('projects.title', 'Projects')}</h2>
      <div className="projects-grid">
        {projects.map((p) => (
          <div key={p.name} className="project-card">
            <ProjectCard project={p} image={getPrimaryImage(p)} />
          </div>
        ))}
      </div>
    </section>
  );
};

export default Projects;
