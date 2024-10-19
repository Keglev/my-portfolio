import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { fetchPinnedRepositories } from '../utils/githubApi';

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
    <ProjectContainer id="Projects">
      <h2>Projects</h2>
      <ProjectGrid>
        {projects.map((project, index) => (
          <ProjectCard key={index}>
            <ProjectImage
              src={getProjectImageUrl(project.name)} // Try loading image from main branch first
              onError={(e) => {
                // If the main branch image fails to load, try loading from the master branch
                e.target.onerror = null; // Prevent infinite loop in case master also fails
                e.target.src = getProjectImageUrl(project.name, 'master');
              }}
              alt={`${project.name} project image`}
            />
            <ProjectContent>
              <h3>{project.name}</h3>
              <p>{getAboutSection(project.object?.text)}</p> {/* Extract "About" from README */}
              <Technologies>
                {getTechnologyWords(project.object?.text).map((word, idx) => (
                  <TechBox key={idx}>{word}</TechBox> // Display each technology in its own box
                ))}
              </Technologies>
              <ProjectLink href={project.url} target="_blank" rel="noopener noreferrer">
                View on GitHub
              </ProjectLink>
            </ProjectContent>
          </ProjectCard>
        ))}
      </ProjectGrid>
    </ProjectContainer>
  );
};

// Helper function to generate the project image URL with branch fallback logic
const getProjectImageUrl = (repoName, branch = 'main') => {
  return `https://raw.githubusercontent.com/keglev/${repoName}/${branch}/src/assets/imgs/project-image.png`;
};

// Helper function to extract the "About" section from README.md
const getAboutSection = (readmeText) => {
  if (!readmeText) return 'No description available';

  // Find the "## About" section in the README.md file
  const aboutIndex = readmeText.toLowerCase().indexOf('## about');

  if (aboutIndex === -1) {
    return 'No "About" section found.';
  }

  // Extract the content after the "## About" heading
  const contentAfterAbout = readmeText.substring(aboutIndex).split('\n').slice(1);

  // Filter out any empty lines and stop when encountering another heading (## or #)
  const aboutSection = [];
  for (let line of contentAfterAbout) {
    if (line.trim().startsWith('#')) break; // Stop at the next section heading
    if (line.trim()) aboutSection.push(line); // Only add non-empty lines
  }

  // Join the lines into a single paragraph
  return aboutSection.join(' ').trim() || 'No description available';
};

// Helper function to extract words with an asterisk (*) from the "Technologies" section
const getTechnologyWords = (readmeText) => {
  if (!readmeText) return [];

  // Find the "## Technologies" section in the README.md file
  const techIndex = readmeText.toLowerCase().indexOf('## technologies');

  if (techIndex === -1) {
    return []; // If no "Technologies" section is found, return an empty array
  }

  // Extract the content after the "## Technologies" heading
  const contentAfterTech = readmeText.substring(techIndex).split('\n').slice(1);

  // Extract words that start with an asterisk (*) and return them
  const techWords = [];
  for (let line of contentAfterTech) {
    if (line.trim().startsWith('#')) break; // Stop at the next section heading
    const words = line.match(/\*\w+/g); // Match words starting with *
    if (words) {
      techWords.push(...words.map(word => word.replace('*', ''))); // Remove the asterisk and store the word
    }
  }

  return techWords;
};

// Styled Components (with added margin between Technologies and GitHub link)
const ProjectContainer = styled.div`
  padding: 5rem 2rem;
  background-color: #0a192f;
  color: #ccd6f6;

  h2 {
    font-size: 2rem;
    margin-bottom: 2rem;
    color: #64ffda;
  }
`;

const ProjectGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
`;

const ProjectCard = styled.div`
  background-color: #112240;
  padding: 1.5rem;
  border-radius: 8px;
  transition: background-color 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    background-color: #1f4068;
    box-shadow: 0px 8px 15px rgba(0, 255, 150, 0.5);
  }
`;

const ProjectImage = styled.img`
  width: 100px;
  height: 100px;
  border-radius: 8px;
  margin-bottom: 1rem;
  border: 3px solid #64ffda;
  box-shadow: 0px 5px 10px rgba(0, 0, 0, 0.3);
`;

const ProjectContent = styled.div`
  h3 {
    color: #64ffda;
    margin-bottom: 0.5rem;
  }

  p {
    color: #ccd6f6;
    margin-bottom: 1rem;
  }
`;

// Technologies container styling
const Technologies = styled.div`
  margin-top: 1rem;
  display: flex;
  flex-wrap: wrap; /* To make the tech boxes adjust according to content */
  gap: 0.5rem;
  margin-bottom: 2rem; /* Add space between technologies and View on GitHub link */
`;

// Individual TechBox styling
const TechBox = styled.span`
  background-color: #2b3a59; /* Slightly lighter background */
  color: #ccd6f6;
  padding: 0.3rem 0.6rem;
  border-radius: 12px; /* Rounded corners */
  font-size: 0.9rem;
  transition: background-color 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    background-color: #64ffda;
    color: #0a192f;
    box-shadow: 0px 4px 10px rgba(0, 255, 150, 0.5); /* Hover effect */
  }
`;

// Link styling with added margin at the top
const ProjectLink = styled.a`
  display: inline-block;
  margin-top: 1rem;
  color: #64ffda;
  text-decoration: none;

  &:hover {
    color: #ccd6f6;
  }
`;

export default Projects;
