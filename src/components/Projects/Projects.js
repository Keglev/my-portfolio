import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next'; // Import translation hook
import { fetchPinnedRepositories } from '../../utils/githubApi';
import './Projects.css'; // Importing the CSS file for styling

/**
 * The Projects component fetches and displays pinned repositories from GitHub.
 * Each repository is presented with an image, description, technologies used, and a link to view it on GitHub.
 */
const Projects = () => {
  // State to store the list of projects
  const { t } = useTranslation(); // Initialize translation hook
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState(false); // Track errors
  const [noProjects, setNoProjects] = useState(false); // Track if no pinned projects
  const [loading, setLoading] = useState(true); // Track loading state

  // Fetch pinned repositories on component mount
  useEffect(() => {
    const getProjects = async () => {
      try {
        const projectData = await fetchPinnedRepositories();
        console.log('Fetched project data:', projectData);
        
        if (projectData.length === 0) {
          console.log('No projects found');
          setNoProjects(true);
        } else {
          setProjects(projectData);
          setNoProjects(false);
        }
        setError(false);
      } catch (err) {
        console.error('Error fetching projects:', err);
        setError(true);
        setNoProjects(false);
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
          {Array.from({ length: 6 }).map((_, index) => (
            <div className="project-card skeleton" key={index}>
              <div className="skeleton-image"></div>
              <div className="project-content">
                <div className="skeleton-title"></div>
                <div className="skeleton-description"></div>
                <div className="skeleton-technologies">
                  <div className="skeleton-tech"></div>
                  <div className="skeleton-tech"></div>
                  <div className="skeleton-tech"></div>
                </div>
                <div className="skeleton-link"></div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        // Error message if the API fails to fetch projects
        <p className="error-message">Unable to load projects. Your GitHub token may be expired or invalid.</p>
      ) : noProjects ? (
        <p className="error-message">No pinned repositories found. Please pin some projects on your GitHub profile.</p>
      ) : (
      <div className="project-grid">
        {projects.map((project, index) => (
          <div className="project-card" key={index}>
            {/* Project image with fallback to the master branch if the main branch image fails */}
            <img
              src={getProjectImageUrl(project.name)}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = getProjectImageUrl(project.name, 'master'); // Fallback if image is not found in the main branch
              }}
              alt={`${project.name} project`}  // Alt text without the word "image"
              className="project-image"
            />
            <div className="project-content">
              {/* Project name */}
              <h3>{project.name}</h3>
              
              {/* Displaying the "About" section extracted from the repository's README file */}
              <p>{getAboutSection(project.object?.text)}</p>
              
              {/* Technologies used in the project */}
              <div className="technologies">
                {getTechnologyWords(project.object?.text).map((word, idx) => (
                  <span className="tech-box" key={idx}>{word}</span> // Each technology in a styled box
                ))}
              </div>
              
              {/* Link to view the project on GitHub */}
              <a href={project.url} target="_blank" rel="noopener noreferrer" className="project-link">
              {t('viewOnGithub')} {/* Translate button text */}
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
  return aboutSection.join(' ').trim() || 'No description available';
};

/**
 * Helper function to extract technologies from the "Technologies" section of the README file.
 * @param {string} readmeText - Content of the README file
 * @returns {Array} - Array of technology names
 */
const getTechnologyWords = (readmeText) => {
  if (!readmeText) return [];

  console.log("Processing README for Tech Stack:", readmeText);

  // Match "## Technologies" with or without spaces and emojis
  const techMatch = readmeText.match(/##+\s*Technologies/i);

  if (!techMatch) {
    console.log("Technologies section NOT found in README.");
    return [];
  }

  console.log("Technologies section FOUND in README!");

  // Extract content after "Technologies"
  const contentAfterTech = readmeText.substring(techMatch.index).split('\n').slice(1);
  console.log("Extracted Tech Section Content:", contentAfterTech);
  const techWords = [];

  for (let line of contentAfterTech) {
    if (line.trim().startsWith('#')) break; // Stop at the next section

    // Skip empty lines, links, and unrelated sections
    if (!line.trim() || line.toLowerCase().includes("contributing") || line.startsWith("[")) {
      continue;
    }
    console.log("Processing Line:", line);

    // Extract technologies that start with "*Tech" or "**Tech"
    const words = line.match(/\*\s*([\w\s()-]+)/g);
    if (words) {
      words.forEach(word => {
        const extractedWord = word.replace(/^\*\s*/, '').trim(); // Remove leading "*"
        console.log("Extracted Technology:", extractedWord);
        techWords.push(extractedWord);
      });
    }
  }

  console.log("Extracted Tech Stack:", techWords);
  return techWords;
};


export default Projects;
