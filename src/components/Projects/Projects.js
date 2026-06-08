import React from 'react';
import { useTranslation } from 'react-i18next';
import ProjectCard from './ProjectCard';
import { getPrimaryImage } from './projectsUtils';
import useProjects from './useProjects';
import './Projects.css';

const Projects = () => {
  const { t } = useTranslation();
  const { projects, loadedImages, setLoadedImages } = useProjects();

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
