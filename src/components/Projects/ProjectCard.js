import React from 'react';
import { useTranslation } from 'react-i18next';

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

  // Prefer explicit image prop (passed by parent). Fallback to public media path.
  const initialSrc = image || `/projects_media/${project.name}/project-image.png`;

  const handleError = (e) => {
    const img = e.currentTarget;
    const tries = parseInt(img.getAttribute('data-try') || '0', 10);
    if (tries === 0) {
      img.setAttribute('data-try', '1');
      // try remote raw URL for 'main' branch first
      try {
        if (typeof getProjectImageUrl === 'function') { img.src = getProjectImageUrl(project.name, 'main'); return; }
        img.src = `https://raw.githubusercontent.com/keglev/${project.name}/main/src/assets/imgs/project-image.png`;
        return;
      } catch (err) {}
      // fall back to the default public path
      img.src = `/projects_media/${project.name}/project-image.png`;
      return;
    }
    if (tries === 1) {
      img.setAttribute('data-try', '2');
      // try remote raw URL for 'master' branch
      try {
        if (typeof getProjectImageUrl === 'function') { img.src = getProjectImageUrl(project.name, 'master'); return; }
        img.src = `https://raw.githubusercontent.com/keglev/${project.name}/master/src/assets/imgs/project-image.png`;
        return;
      } catch (err) {}
      if (typeof generatePlaceholderSVGDataUrl === 'function') {
        img.src = generatePlaceholderSVGDataUrl(project.name);
      } else {
        // simple 1x1 transparent pixel as last resort
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
          const displaySummary = (i18n.language === 'de' && project.summary_de) ? project.summary_de : (about || project.summary);
          if (displaySummary && displaySummary.trim()) {
            return (
              <p>
                {displaySummary}
                {(i18n.language === 'de' && !project.summary_de) && (
                  <span style={{fontStyle: 'italic', marginLeft: '8px', color: '#666', fontSize: '0.9em'}}>({t('translationMissing') || 'Übersetzung fehlt'})</span>
                )}
              </p>
            );
          }
          return <div className="skeleton-description short skeleton" style={{width: '60%'}} />;
        })()}
        <div className="technologies">
          {(project.technologies && project.technologies.length > 0 ? project.technologies : getTechnologyWords(project.object?.text)).map((word, idx) => (
            <span className="tech-box" key={idx}>{word}</span>
          ))}
        </div>
        <div style={{display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px'}}>
          <a href={project.url} target="_blank" rel="noopener noreferrer" className="project-link">
            {t('viewOnGithub')}
          </a>
          {/* Production URL: show descriptive label below GitHub link when extractor found a Production URL in repo docs */}
          {project.repoDocs && project.repoDocs.productionUrl && project.repoDocs.productionUrl.link && (
            (() => {
              const convertRawToBlob = (link) => {
                if (!link) return link;
                try {
                  const m = link.match(/^https:\/\/raw\.githubusercontent\.com\/([^/]+)\/([^/]+)\/([^/]+)\/(.+)$/i);
                  if (m) {
                    const user = m[1];
                    const repo = m[2];
                    const branch = m[3];
                    const path = m[4];
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
