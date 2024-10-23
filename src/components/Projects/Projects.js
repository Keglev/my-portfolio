// src/components/Projects/Projects.js
import React, { useEffect, useState } from 'react';
import { fetchPinnedRepositories } from '../../utils/githubApi';
import './Projects.css'; // Importing the CSS file

const Projects = () => {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    const getProjects = async () => {
      const projectData = await fetchPinnedRepositories(); // Fetch pinned projects
      console.log('Fetched Projects:', projectData); // Log the fetched projects for debugging
      setProjects(projectData);
    };
    getProjects();
  }, []);

  return (
    <div className="project-container" id="Projects">
      <h2>Projects</h2>
      <div className="project-grid">
        {projects.map((project, index) => (
          <div className="project-card" key={index}>
          <img
              src={getProjectImageUrl(project.name)}
              onError={(e) => {
              e.target.onerror = null;
              e.target.src = getProjectImageUrl(project.name, 'master');
              }}
              alt={`${project.name} project`}  // Removed the redundant word "image"
               className="project-image"
          />

            <div className="project-content">
              <h3>{project.name}</h3>
              <p>{getAboutSection(project.object?.text)}</p> {/* Extract "About" from README */}
              <div className="technologies">
                {getTechnologyWords(project.object?.text).map((word, idx) => (
                  <span className="tech-box" key={idx}>{word}</span>
                ))}
              </div>
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

// Helper functions
const getProjectImageUrl = (repoName, branch = 'main') => {
  return `https://raw.githubusercontent.com/keglev/${repoName}/${branch}/src/assets/imgs/project-image.png`;
};

const getAboutSection = (readmeText) => {
  if (!readmeText) return 'No description available';

  const aboutIndex = readmeText.toLowerCase().indexOf('## about');
  if (aboutIndex === -1) return 'No "About" section found.';

  const contentAfterAbout = readmeText.substring(aboutIndex).split('\n').slice(1);
  const aboutSection = [];
  for (let line of contentAfterAbout) {
    if (line.trim().startsWith('#')) break;
    if (line.trim()) aboutSection.push(line);
  }
  return aboutSection.join(' ').trim() || 'No description available';
};

const getTechnologyWords = (readmeText) => {
  if (!readmeText) return [];

  const techIndex = readmeText.toLowerCase().indexOf('## technologies');
  if (techIndex === -1) return [];

  const contentAfterTech = readmeText.substring(techIndex).split('\n').slice(1);
  const techWords = [];
  for (let line of contentAfterTech) {
    if (line.trim().startsWith('#')) break;
    const words = line.match(/\*\w+/g);
    if (words) {
      techWords.push(...words.map(word => word.replace('*', '')));
    }
  }
  return techWords;
};

export default Projects;
