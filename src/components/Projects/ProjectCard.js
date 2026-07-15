import React from 'react';
import { useTranslation } from 'react-i18next';
import { generatePlaceholderSVGDataUrl } from './projectsUtils';
import ProjectSummary from './ProjectSummary';

/**
 * Renders a single curated project card: preview image, title, summary,
 * technology tags, and up to four links (repo, optional second repo, live app,
 * docs). Image load failures fall back to an inline SVG placeholder — the card
 * never shows a broken-image icon.
 *
 * @param {Object} project - Curated project data (ProjectConfig shape from src/data/projects.config)
 * @param {number} index - Position in the projects array; key into loadedImages
 * @param {object} loadedImages - Map of index → boolean tracking loaded images
 * @param {Function} setLoadedImages - Setter for loadedImages state
 * @returns {JSX.Element}
 */
const ProjectCard = ({ project, index, loadedImages = {}, setLoadedImages = () => {} }) => {
  const { t, i18n } = useTranslation();

  // Portfolio is dark-only today; when a theme toggle is added, replace this
  // with the active theme. Image is picked by theme then language, falling back
  // to English, then to any available image.
  const theme = 'dark';
  const lang = (i18n.language || 'en').toLowerCase().startsWith('de') ? 'de' : 'en';
  const themeSet = (project.images && project.images[theme]) || {};
  const imageSrc =
    themeSet[lang] ||
    themeSet.en ||
    (project.images && project.images.dark && project.images.dark.en) ||
    '';

  // Single, deterministic fallback: config image → inline SVG placeholder.
  const handleError = (e) => {
    const img = e.currentTarget;
    if (img.getAttribute('data-fallback') !== '1') {
      img.setAttribute('data-fallback', '1');
      img.src = generatePlaceholderSVGDataUrl(project.displayName);
    }
    setLoadedImages(prev => ({ ...prev, [index]: true }));
  };

  return (
    <div className={'project-card ' + (loadedImages[index] ? 'visible' : '')}>
      <div className="image-wrap">
        <img
          src={imageSrc}
          alt={project.displayName + ' preview'}
          className={'project-image ' + (loadedImages[index] ? 'loaded' : '')}
          loading="lazy"
          onLoad={() => setLoadedImages(prev => ({ ...prev, [index]: true }))}
          onError={handleError}
        />
      </div>
      <div className="project-content">
        <h3>{project.displayName}</h3>
        <ProjectSummary project={project} language={i18n.language} />
        <div className="technologies">
          {project.tech.map((word, idx) => (
            <span className="tech-box" key={idx}>{word}</span>
          ))}
        </div>
        <div className="project-links">
          <a href={project.repoUrl} target="_blank" rel="noopener noreferrer" className="project-link">
            {t('viewOnGithub')}
          </a>
          {project.repoUrlSecondary && (
            <a href={project.repoUrlSecondary} target="_blank" rel="noopener noreferrer" className="project-link">
              {t('viewOnGithubFrontend', 'Frontend on GitHub')}
            </a>
          )}
          {project.liveUrl && (
            <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" className="project-link">
              {t('urlLabel')}
            </a>
          )}
          {project.docsUrl && (
            <a href={project.docsUrl} target="_blank" rel="noopener noreferrer" className="project-link">
              {t('viewDocs', 'Documentation')}
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
