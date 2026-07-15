import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ProjectCard from './ProjectCard';
import projects from '../../data/projects.config';
import './Projects.css';

/**
 * Renders the portfolio's Projects section.
 *
 * Reads curated project data directly from src/data/projects.config (no runtime
 * fetch). Card content, titles, tech tags, images and links are all controlled
 * there. `loadedImages` tracks per-card image load state for the entrance
 * animation handled in ProjectCard/Projects.css.
 *
 * @returns {JSX.Element} Grid of curated project cards.
 */
const Projects = () => {
  const { t } = useTranslation();
  const [loadedImages, setLoadedImages] = useState({});

  return (
    <section className="project-container" id="Projects">
      <h2>{t('projects', 'Projects')}</h2>
      <div className="project-grid">
        {projects.map((project, idx) => (
          <ProjectCard
            key={project.slug || idx}
            project={project}
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
