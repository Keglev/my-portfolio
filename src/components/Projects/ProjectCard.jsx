/**
 * @file ProjectCard.js
 * @module components/Projects/ProjectCard
 * @summary Renders a single curated project card: preview image, title,
 * summary, technology tags, and up to five links in a locked order (live
 * app, docs hub, repo, optional second repo, API reference), plus an
 * optional secondary row of deep documentation links.
 * @enterprise Image load failures fall back to an inline SVG placeholder
 * (projectsUtils.generatePlaceholderSVGDataUrl) -- the card never shows a
 * broken-image icon. The local `lang` variable (line ~27) independently
 * re-derives "is this German" via a startsWith check; ProjectSummary
 * receives the raw i18n.language instead and re-derives its own version
 * via strict equality. Both resolve to the same result for this app's
 * only two real language codes ('de'/'en') but are duplicated logic, not
 * unified here -- flagging rather than expanding this pass's scope.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { generatePlaceholderSVGDataUrl } from './projectsUtils';
import ProjectSummary from './ProjectSummary';
import { useTheme } from '../../context/ThemeContext';

/**
 * @param {Object} project - Curated project data (ProjectConfig shape from src/data/projects.config)
 * @param {number} index - Position in the projects array; key into loadedImages
 * @param {object} loadedImages - Map of index -> boolean tracking loaded images
 * @param {Function} setLoadedImages - Setter for loadedImages state
 * @returns {JSX.Element}
 */
const ProjectCard = ({ project, index, loadedImages = {}, setLoadedImages = () => {} }) => {
  const { t, i18n } = useTranslation();

  // Active theme (from ThemeContext; defaults to dark without a provider) picks
  // the screenshot set; language picks the variant, falling back to English,
  // then to the dark English image so a missing light asset never breaks a card.
  const { theme } = useTheme();
  const lang = (i18n.language || 'en').toLowerCase().startsWith('de') ? 'de' : 'en';
  const themeSet = (project.images && project.images[theme]) || {};
  const imageSrc =
    themeSet[lang] ||
    themeSet.en ||
    (project.images && project.images.dark && project.images.dark.en) ||
    '';

  // Single, deterministic fallback: config image -> inline SVG placeholder.
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
          {project.liveUrl && (
            <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" className="project-link">
              {t('urlLabel')}
            </a>
          )}
          {project.docsUrl && (
            <a href={project.docsUrl} target="_blank" rel="noopener noreferrer" className="project-link">
              {t('viewDocs', 'Documentation hub')}
            </a>
          )}
          <a href={project.repoUrl} target="_blank" rel="noopener noreferrer" className="project-link">
            {t('viewOnGithub')}
          </a>
          {project.repoUrlSecondary && (
            <a href={project.repoUrlSecondary} target="_blank" rel="noopener noreferrer" className="project-link">
              {t('viewOnGithubFrontend', 'Frontend on GitHub')}
            </a>
          )}
          {project.apiUrl && (
            <a href={project.apiUrl} target="_blank" rel="noopener noreferrer" className="project-link">
              {t('apiRefLabel', 'API reference')}
            </a>
          )}
        </div>
        {/* Secondary doc-links row (on trial): deep documentation links, kept
            visually quieter than the primary links above */}
        {Array.isArray(project.docLinks) && project.docLinks.length > 0 && (
          <ul className="doc-links-row">
            {project.docLinks.map((link, idx) => (
              <li key={idx}>
                <a href={link.url} target="_blank" rel="noopener noreferrer">
                  {lang === 'de' ? link.titleDe : link.titleEn}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ProjectCard;
