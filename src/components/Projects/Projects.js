import React, { useMemo } from 'react';
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
  const projects = useMemo(() => ProjectsData || [], []);

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
