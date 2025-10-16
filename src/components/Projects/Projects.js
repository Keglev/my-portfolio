import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next'; // Import translation hook
// fetchPinnedRepositories intentionally not used in production; we force build-time /projects.json
import './Projects.css'; // Importing the CSS file for styling
// placeholder SVG will be generated on the fly when an image fails to load

/**
 * The Projects component fetches and displays pinned repositories from GitHub.
 * Each repository is presented with an image, description, technologies used, and a link to view it on GitHub.
 */
const Projects = () => {
  // State to store the list of projects
  const { t, i18n } = useTranslation(); // Initialize translation hook and i18n instance
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState(false); // Track errors
  const [loading, setLoading] = useState(true); // Track loading state
  // Track which project's image has loaded (by index) so we can fade the card in
  const [loadedImages, setLoadedImages] = useState({});

  // Fetch pinned repositories on component mount.
  // Runtime-first: try fetching live pinned repos via GitHub (so we detect token/permission issues),
  // then fall back to static /projects.json created at build-time.
  useEffect(() => {
    const getProjects = async () => {
      try {
        const resp = await fetch('/projects.json');
        if (resp.ok) {
          const data = await resp.json();
          setProjects(data);
          setError(false);
          return;
        }
        setError(true);
      } catch (err) {
        console.error('Error loading projects.json:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    getProjects();
  }, []);

  return (
    <div className="project-container" id="Projects">
      {/* Heading for the projects section */}
      <h2>{t('projects')}</h2>
      
      {/* Displaying each project as a card */}
      {loading ? (
        <div className="project-grid">
          {[0,1,2].map(i => (
            <div className="project-card visible" key={`skeleton-${i}`}>
              <div className="image-wrap skeleton">
                <div className="skeleton-image" />
              </div>
              <div className="project-content">
                <div className="skeleton-title skeleton" />
                <div className="skeleton-description skeleton" />
                <div className="skeleton-technologies">
                  <div className="skeleton-tech skeleton" />
                  <div className="skeleton-tech skeleton" />
                </div>
                <div className="skeleton-link skeleton" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <p className="error-message">Unable to load projects. Check your GitHub token or pin some repositories on your profile.</p>
      ) : (
        <div className="project-grid">
          {projects.map((project, index) => (
            <div className={'project-card ' + (loadedImages[index] ? 'visible' : '')} key={index}>
              <div className="image-wrap">
                <img
                  src={getPrimaryImage(project)}
                  alt={project.name + ' project'}
                  className={'project-image ' + (loadedImages[index] ? 'loaded' : '')}
                  loading="lazy"
                  onLoad={() => setLoadedImages(prev => ({ ...prev, [index]: true }))}
                  onError={(e) => {
                    const img = e.currentTarget;
                    const tries = parseInt(img.getAttribute('data-try') || '0', 10);
                    if (tries === 0) {
                      // try master branch
                      img.setAttribute('data-try', '1');
                      img.src = getProjectImageUrl(project.name, 'master');
                      return;
                    }
                    if (tries === 1) {
                      // final fallback: inline SVG placeholder with repo name
                      img.setAttribute('data-try', '2');
                      img.src = generatePlaceholderSVGDataUrl(project.name);
                    }
                    setLoadedImages(prev => ({ ...prev, [index]: true }));
                  }}
                />
              </div>
              <div className="project-content">
                <h3>{project.name}</h3>
                {/* Prefer translated summary, then About section (if present), then generated summary; show skeleton when missing to avoid flicker */}
                {(() => {
                  const about = getAboutSection(project.object?.text);
                  // Debug: log i18n language and available summaries to diagnose translation issues
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
                  // short skeleton placeholder when summary isn't available yet
                  return <div className="skeleton-description short skeleton" style={{width: '60%'}} />;
                })()}
                <div className="technologies">
                  {(project.technologies && project.technologies.length > 0 ? project.technologies : getTechnologyWords(project.object?.text)).map((word, idx) => (
                    <span className="tech-box" key={idx}>{word}</span>
                  ))}
                </div>
                <div style={{display: 'flex', gap: '8px', marginTop: '8px'}}>
                  <a href={project.url} target="_blank" rel="noopener noreferrer" className="project-link">
                    {t('viewOnGithub')}
                  </a>
                  {(() => {
                    // Prefer structured repoDocs (apiDocumentation -> architectureOverview), fall back to legacy fields
                    const isBadTitle = (s) => !s || /open an issue|question|contribut/i.test(String(s).toLowerCase());
                    const pick = () => {
                      try {
                        if (project.repoDocs && project.repoDocs.apiDocumentation && project.repoDocs.apiDocumentation.link) {
                          return { link: project.repoDocs.apiDocumentation.link, title: project.repoDocs.apiDocumentation.title };
                        }
                        if (project.repoDocs && project.repoDocs.architectureOverview && project.repoDocs.architectureOverview.link) {
                          return { link: project.repoDocs.architectureOverview.link, title: project.repoDocs.architectureOverview.title };
                        }
                        if (project.docs && project.docs.apiDocumentation && project.docs.apiDocumentation.link) {
                          return { link: project.docs.apiDocumentation.link, title: project.docs.apiDocumentation.title };
                        }
                        if (project.docs && project.docs.documentation && project.docs.documentation.link) {
                          return { link: project.docs.documentation.link, title: project.docs.documentation.title };
                        }
                        if (project.docsLink) return { link: project.docsLink, title: project.docsTitle };
                      } catch (e) { /* ignore */ }
                      return null;
                    };
                    const picked = pick();
                    // Debug: log the picked docs link/title for this project
                    try { console.debug('Projects: picked docs for', project.name, picked); } catch (e) {}
                    if (picked && picked.link && !isBadTitle(picked.title)) {
                      // Use a short localized label for links and append a small badge describing the doc type (API / ReDoc / Architecture)
                      const linkLabel = t('viewDocs') || 'View docs';
                      const titleLower = String(picked.title || '').toLowerCase();
                      const linkLower = String(picked.link || '').toLowerCase();
                      let docType = null;
                      if (/redoc|redocly/.test(titleLower) || /redoc/.test(linkLower)) docType = 'ReDoc';
                      else if (/architecture/.test(titleLower) || /architecture/.test(linkLower)) docType = 'Architecture';
                      else if (/api|openapi|swagger/.test(titleLower) || /api|openapi|swagger/.test(linkLower)) docType = 'API';

                      const badgeText = docType ? (i18n.language === 'de' ? (docType === 'Architecture' ? 'Architektur' : docType) : docType) : null;
                      return (
                        <a href={picked.link} target="_blank" rel="noopener noreferrer" className="project-link">
                          {linkLabel}
                          {badgeText && <span style={{marginLeft: '8px', fontSize: '0.85em', color: '#666'}}>{badgeText}</span>}
                        </a>
                      );
                    }
                    // no good docs link
                    return null;
                  })()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Helper function to generate the project image URL with fallback to the master branch.
 * @param {string} repoName - Name of the repository
 * @param {string} branch - Branch name (default: 'main')
 * @returns {string} - Image URL
 */
const getProjectImageUrl = (repoName, branch = 'main') => {
  return `https://raw.githubusercontent.com/keglev/${repoName}/${branch}/src/assets/imgs/project-image.png`;
};

// Try to find a rewritten /projects_media/<repo>/... URL inside the README body (preferred), otherwise fall back to default path.
const getPrimaryImage = (project) => {
  try {
    // if fetch script rewrote and stored primaryImage, prefer it
    if (project && project.primaryImage) return project.primaryImage;
    const readme = project.object && project.object.text;
    if (readme) {
      // exclude space, double-quote, single-quote and closing paren
  const re = new RegExp(`/projects_media/${project.name}/[^ "')]+`,'i');
      const m = readme.match(re);
      if (m && m[0]) return m[0];
    }
  } catch (e) {
    // ignore
  }
  return getProjectImageUrl(project.name);
};

// Generate a small inline SVG data URL with repository name (professional placeholder)
const generatePlaceholderSVGDataUrl = (title) => {
  const safe = (title || 'Project').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns='http://www.w3.org/2000/svg' width='1200' height='675' viewBox='0 0 1200 675'><rect width='100%' height='100%' fill='%230f2238' rx='8'/><text x='50%' y='45%' fill='%239ec7ef' font-family='Arial, Helvetica, sans-serif' font-size='36' font-weight='600' text-anchor='middle'>Image not available</text><text x='50%' y='58%' fill='%237aa7d9' font-family='Arial, Helvetica, sans-serif' font-size='20' text-anchor='middle'>${safe}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

/**
 * Helper function to extract the "About" section from the README file of the repository.
 * @param {string} readmeText - Content of the README file
 * @returns {string} - Extracted "About" section
 */
const getAboutSection = (readmeText) => {
  if (!readmeText) return null;

  // Find a heading that mentions "about" (any level: #, ##, ###)
  const match = readmeText.match(/(^|\n)#{1,6}\s*about\b/i);
  if (!match) return null;

  const start = match.index + match[0].length;
  // Get content after the About heading and stop at the next heading of any level
  const after = readmeText.slice(start);
  const lines = after.split('\n');
  const aboutLines = [];
  for (const line of lines) {
    if (/^#{1,6}\s+/.test(line)) break;
    if (line.trim()) aboutLines.push(line.trim());
  }
  if (aboutLines.length === 0) return null;
  let about = aboutLines.join(' ');
  // strip common markdown formatting (headings, emphasis, code, links)
  about = about.replace(/^#+\s*/, '')
               .replace(/\*\*(.*?)\*\*/g, '$1')
               .replace(/\*(.*?)\*/g, '$1')
               .replace(/`([^`]*)`/g, '$1')
               .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
               .replace(/<[^>]+>/g, '')
               .replace(/\s+/g, ' ')
               .trim();
  const MAX = 240;
  return about.length > MAX ? about.slice(0, MAX).trim() + '...' : about;
};

/**
 * Helper function to extract technologies from the "Technologies" section of the README file.
 * @param {string} readmeText - Content of the README file
 * @returns {Array} - Array of technology names
 */
const getTechnologyWords = (readmeText) => {
  if (!readmeText) return [];

  // Match "## Technologies" with or without spaces and emojis
  const techMatch = readmeText.match(/##+\s*Technologies/i);

  if (!techMatch) {
    return [];
  }

  // Extract content after "Technologies"
  const contentAfterTech = readmeText.substring(techMatch.index).split('\n').slice(1);
  const techWords = [];

  for (let line of contentAfterTech) {
    if (line.trim().startsWith('#')) break; // Stop at the next section

    // Skip empty lines, links, and unrelated sections
    if (!line.trim() || line.toLowerCase().includes("contributing") || line.startsWith("[")) {
      continue;
    }

    // Extract technologies that start with "*Tech" or "**Tech"
    const words = line.match(/\*\s*([\w\s()-]+)/g);
    if (words) {
      words.forEach(word => {
        const extractedWord = word.replace(/^\*\s*/, '').trim(); // Remove leading "*"
        techWords.push(extractedWord);
      });
    }
  }

  return techWords;
};


export default Projects;
