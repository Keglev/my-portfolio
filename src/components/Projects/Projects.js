/**
 * @file Projects.js
 * @module components/Projects/Projects
 * @summary Renders the portfolio's Projects section.
 * @enterprise Reads curated project data directly from data/projects.config
 * (no runtime fetch). Card content, titles, tech tags, images, and links
 * are all controlled there. `loadedImages` tracks per-card image load
 * state for the entrance animation handled in ProjectCard/Projects.css.
 * Below the grid, a small "portfolio meta" strip links to this site's own
 * source, docs, and coverage report -- proof the same documentation and
 * testing standard applies to itself.
 */
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ProjectCard from './ProjectCard';
import projects from '../../data/projects.config';
import './Projects.css';

/**
 * @returns {JSX.Element} Grid of curated project cards plus the portfolio-meta strip.
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
      <p className="portfolio-meta">
        {t('portfolioMeta.text')}{' '}
        <a href="https://github.com/Keglev/my-portfolio" target="_blank" rel="noopener noreferrer">
          {t('portfolioMeta.source')}
        </a> ·{' '}
        <a href="https://keglev.github.io/my-portfolio/" target="_blank" rel="noopener noreferrer">
          {t('portfolioMeta.docs')}
        </a> ·{' '}
        <a href="https://keglev.github.io/my-portfolio/coverage/index.html" target="_blank" rel="noopener noreferrer">
          {t('portfolioMeta.coverage')}
        </a>
      </p>
    </section>
  );
};

export default Projects;
