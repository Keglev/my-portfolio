import React, { useEffect, useState } from 'react';
import { fetchPinnedRepositories } from '../../utils/githubApi';
import './Projects.css'; // Importing the CSS file for styling

/**
 * The Projects component fetches and displays pinned repositories from GitHub.
 * Each repository is presented with an image, description, technologies used, and a link to view it on GitHub.
 */
const Projects = () => {
  // State to store the list of projects
  const [projects, setProjects] = useState([]);

  // Fetch pinned repositories on component mount
  useEffect(() => {
    const getProjects = async () => {
      const projectData = await fetchPinnedRepositories(); // Fetch pinned projects from GitHub
      console.log('Fetched Projects:', projectData); // Debugging: log fetched data
      setProjects(projectData); // Update state with fetched projects
    };
    getProjects();
  }, []);

  return (
    <div className="project-container" id="Projects">
      {/* Heading for the projects section */}
      <h2>Projects</h2>
      
      {/* Displaying each project as a card */}
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
                View on GitHub
              </a>
            </div>
          </div>
        ))}
      </div>
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
