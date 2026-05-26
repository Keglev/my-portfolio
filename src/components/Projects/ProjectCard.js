import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Renders a single project card with a lazy-loaded image, localised description,
 * technology tags, and links to the GitHub repository and (optionally) a live URL.
 *
 * Image loading follows a three-step fallback chain:
 *   1. Explicit `image` prop or bundled public-folder asset
 *   2. Raw GitHub content on the `main` branch
 *   3. Raw GitHub content on the `master` branch → SVG placeholder → 1×1 transparent GIF
 *
 * @param {object}   props.project                    - Normalised project data object
 * @param {number}   props.index                      - Card position; used as the loadedImages key
 * @param {object}   props.loadedImages               - Map of index → boolean tracking image load state
 * @param {Function} props.setLoadedImages            - State setter for loadedImages
 * @param {string}   [props.image]                    - Pre-resolved image URL supplied by the parent
 * @param {Function} [props.getProjectImageUrl]       - Returns a remote raw image URL for a given repo/branch
 * @param {Function} [props.generatePlaceholderSVGDataUrl] - Generates a named SVG placeholder data URL
 * @param {Function} [props.getAboutSection]          - Extracts the About section text from raw README markdown
 * @param {Function} [props.getTechnologyWords]       - Derives technology tags from raw README markdown
 */
const ProjectCard = ({
  project,
  index,
  loadedImages = {},
  setLoadedImages = () => {},
  image,
  getProjectImageUrl,
  generatePlaceholderSVGDataUrl,
  getAboutSection = () => null,
  getTechnologyWords = () => []
}) => {
  const { t, i18n } = useTranslation();

  // Prefer the pre-resolved image from the parent; fall back to the conventional public-folder path
  const initialSrc = image || `/projects_media/${project.name}/project-image.png`;

  /**
   * Progressive image fallback handler.
   * `data-try` on the <img> element tracks how many fallbacks have been attempted
   * so repeated `onerror` events don't restart the chain.
   */
  const handleError = (e) => {
    const img = e.currentTarget;
    const tries = parseInt(img.getAttribute('data-try') || '0', 10);

    if (tries === 0) {
      img.setAttribute('data-try', '1');
      try {
        // Attempt the `main` branch remote URL first
        if (typeof getProjectImageUrl === 'function') { img.src = getProjectImageUrl(project.name, 'main'); return; }
        img.src = `https://raw.githubusercontent.com/keglev/${project.name}/main/src/assets/imgs/project-image.png`;
        return;
      } catch (err) {}
      img.src = `/projects_media/${project.name}/project-image.png`;
      return;
    }

    if (tries === 1) {
      img.setAttribute('data-try', '2');
      try {
        // Fall back to `master` branch before giving up on remote content
        if (typeof getProjectImageUrl === 'function') { img.src = getProjectImageUrl(project.name, 'master'); return; }
        img.src = `https://raw.githubusercontent.com/keglev/${project.name}/master/src/assets/imgs/project-image.png`;
        return;
      } catch (err) {}
      if (typeof generatePlaceholderSVGDataUrl === 'function') {
        img.src = generatePlaceholderSVGDataUrl(project.name);
      } else {
        // Last resort: 1×1 transparent GIF to silence the broken-image indicator
        img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';
      }
    }

    setLoadedImages(prev => ({ ...prev, [index]: true }));
  };

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
        {(() => {
          const about = getAboutSection(project.object?.text);
          try { console.debug('Projects: i18n.language', i18n.language, 'project', project.name, 'summary_de', project.summary_de, 'summary', project.summary, 'about', about); } catch (e) {}
          // Priority: German summary field → parsed README About section → English summary
          const displaySummary = (i18n.language === 'de' && project.summary_de) ? project.summary_de : (about || project.summary);
          if (displaySummary && displaySummary.trim()) {
            return (
              <p>
                {displaySummary}
                {/* Inline notice when the active locale is German but no German summary is available */}
                {(i18n.language === 'de' && !project.summary_de) && (
                  <span style={{fontStyle: 'italic', marginLeft: '8px', color: '#666', fontSize: '0.9em'}}>({t('translationMissing') || 'Übersetzung fehlt'})</span>
                )}
              </p>
            );
          }
          // Render a skeleton placeholder while the description is still loading
          return <div className="skeleton-description short skeleton" style={{width: '60%'}} />;
        })()}
        <div className="technologies">
          {/* Use pre-parsed technology list when available; otherwise extract keywords from README text */}
          {(project.technologies && project.technologies.length > 0 ? project.technologies : getTechnologyWords(project.object?.text)).map((word, idx) => (
            <span className="tech-box" key={idx}>{word}</span>
          ))}
        </div>
        <div style={{display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px'}}>
          <a href={project.url} target="_blank" rel="noopener noreferrer" className="project-link">
            {t('viewOnGithub')}
          </a>
          {/* Render the live/production URL only when the repo docs pipeline resolved one */}
          {project.repoDocs && project.repoDocs.productionUrl && project.repoDocs.productionUrl.link && (
            (() => {
              // raw.githubusercontent.com links must be rewritten to github.com/blob/ for user-facing navigation
              const convertRawToBlob = (link) => {
                if (!link) return link;
                try {
                  const m = link.match(/^https:\/\/raw\.githubusercontent\.com\/([^/]+)\/([^/]+)\/([^/]+)\/(.+)$/i);
                  if (m) {
                    const [, user, repo, branch, path] = m;
                    return `https://github.com/${user}/${repo}/blob/${branch}/${path}`;
                  }
                } catch (e) { /* ignore */ }
                return link;
              };

              return (
                <a href={convertRawToBlob(project.repoDocs.productionUrl.link)} target="_blank" rel="noopener noreferrer" className="project-link" style={{marginTop: '6px'}}>
                  {t('urlLabel')}
                </a>
              );
            })()
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
