import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  getProjectImageUrl,
  generatePlaceholderSVGDataUrl,
  getTechnologyWords,
  convertRawToBlob,
} from './projectsUtils';
import ProjectSummary from './ProjectSummary';

/**
 * Renders a single project card with image, summary, technologies, and links.
 * Handles progressive image loading and a multi-step fallback chain when images fail.
 *
 * @param {object} project - Project data object from projects.json
 * @param {string} image - Primary image URL resolved by the parent
 * @param {number} index - Position in the projects array, used as the loadedImages key
 * @param {object} loadedImages - Map of index → boolean tracking which images have loaded
 * @param {Function} setLoadedImages - Setter for loadedImages state
 * @returns {JSX.Element}
 */
const ProjectCard = ({ project, index, loadedImages = {}, setLoadedImages = () => {}, image }) => {
  const { t, i18n } = useTranslation();
  const initialSrc = image || `/projects_media/${project.name}/project-image.png`;

  const handleError = (e) => {
    const img = e.currentTarget;
    const tries = parseInt(img.getAttribute('data-try') || '0', 10);

    // Three-step fallback: local asset → main branch → master branch → SVG placeholder
    if (tries === 0) {
      img.setAttribute('data-try', '1');
      img.src = getProjectImageUrl(project.name, 'main');
      return;
    }
    if (tries === 1) {
      img.setAttribute('data-try', '2');
      img.src = getProjectImageUrl(project.name, 'master');
      return;
    }
    if (tries === 2) {
      img.src = generatePlaceholderSVGDataUrl(project.name);
    }
    setLoadedImages(prev => ({ ...prev, [index]: true }));
  };

  // Prefer explicit technologies list; fall back to parsing bold tokens from the README
  const technologies = project.technologies?.length > 0
    ? project.technologies
    : getTechnologyWords(project.object?.text);

  return (
    <div className={'project-card ' + (loadedImages[index] ? 'visible' : '')} key={index}>
      <div className="image-wrap">
        <img
          src={initialSrc}
          alt={project.name + ' project'}
          className={'project-image ' + (loadedImages[index] ? 'loaded' : '')}
          loading="lazy"
          onLoad={() => setLoadedImages(prev => ({ ...prev, [index]: true }))}
          onError={handleError}
        />
      </div>
      <div className="project-content">
        <h3>{project.name}</h3>
        <ProjectSummary project={project} language={i18n.language} t={t} />
        <div className="technologies">
          {technologies.map((word, idx) => (
            <span className="tech-box" key={idx}>{word}</span>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
          <a href={project.url} target="_blank" rel="noopener noreferrer" className="project-link">
            {t('viewOnGithub')}
          </a>
          {project.repoDocs?.productionUrl?.link && (
            <a
              href={convertRawToBlob(project.repoDocs.productionUrl.link)}
              target="_blank"
              rel="noopener noreferrer"
              className="project-link"
              style={{ marginTop: '6px' }}
            >
              {t('urlLabel')}
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
