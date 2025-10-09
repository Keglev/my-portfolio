import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next'; // Import translation hook
import { fetchPinnedRepositories } from '../../utils/githubApi';
import './Projects.css'; // Importing the CSS file for styling
// placeholder SVG will be generated on the fly when an image fails to load

/**
 * The Projects component fetches and displays pinned repositories from GitHub.
 * Each repository is presented with an image, description, technologies used, and a link to view it on GitHub.
 */
const Projects = () => {
  // State to store the list of projects
  const { t } = useTranslation(); // Initialize translation hook
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState(false); // Track errors
  const [loading, setLoading] = useState(true); // Track loading state
  // Track which project's image has loaded (by index) so we can fade the card in
  const [loadedImages, setLoadedImages] = useState({});

  // Fetch pinned repositories on component mount.
  // Prefer a build-time generated /projects.json (no client secret), fall back to runtime GitHub fetch during dev.
  useEffect(() => {
    const getProjects = async () => {
      try {
        // Try build-generated file first
        const resp = await fetch('/projects.json');
        if (resp.ok) {
          const data = await resp.json();
          setProjects(data);
          setError(false);
          return;
        }
        // If not present, fall back to runtime GitHub fetch (dev)
        const projectData = await fetchPinnedRepositories();
        if (projectData.length === 0) {
          setError(true);
        } else {
          setProjects(projectData);
          setError(false);
        }
      } catch (err) {
        console.error('Error loading projects:', err);
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
                  src={getProjectImageUrl(project.name)}
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
                <p>{getAboutSection(project.object?.text)}</p>
                <div className="technologies">
                  {getTechnologyWords(project.object?.text).map((word, idx) => (
                    <span className="tech-box" key={idx}>{word}</span>
                  ))}
                </div>
                <a href={project.url} target="_blank" rel="noopener noreferrer" className="project-link">
                  {t('viewOnGithub')}
                </a>
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
  if (!readmeText) return 'No description available';

  // Find the "About" section in the README
  const aboutIndex = readmeText.toLowerCase().indexOf('## about');
  if (aboutIndex === -1) return 'No "About" section found.';

  // Extract content after "About"
  const contentAfterAbout = readmeText.substring(aboutIndex).split('\n').slice(1);
  const aboutSection = [];
  for (let line of contentAfterAbout) {
    if (line.trim().startsWith('#')) break; // Stop at the next section
    if (line.trim()) aboutSection.push(line);
  }
  const about = aboutSection.join(' ').trim() || 'No description available';
  // Shorten the description to avoid very long text in the UI
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
