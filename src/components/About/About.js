import React from 'react';
import './About.css'; // Import the CSS file for styling
import ProfilePic from '../../assets/profile-pic.jpg'; // Import the profile image
import { SiJavascript, SiReact, SiNodedotjs, SiPostgresql, SiSpringboot, SiGit, SiDocker } from 'react-icons/si'; // Import technology icons
import { TbTestPipe } from 'react-icons/tb'; // Import test pipe icon
import { FaJava, FaGithub } from 'react-icons/fa'; // Import Java and GitHub icons
import { useTranslation } from 'react-i18next'; // Translation function to translate text

/**
 * The About component renders information about the developer
 * and showcases the technologies they are proficient in.
 */
const About = () => {
  const { t } = useTranslation(); // Translation function to translate text
  return (
    <div className="about-container" id="About">
      {/* Content section */}
      {/* Display the heading and description of the about section from the locales directory, according to the selected language*/}
      <div className="content">
        <h2>{t('aboutSection.heading')}</h2>
        <p>{t('aboutSection.description1')}</p>
        <p>{t('aboutSection.description2')}</p>
        <p>{t('aboutSection.description3')}</p>
      
        {/* List of technologies the developer is skilled in */}
        <p>🔧 <strong>Tech Stack:</strong></p>
        <ul className="tech-list">
          <li><FaJava /> Java</li>
          <li><SiSpringboot /> Spring Boot</li>
          <li><SiNodedotjs /> REST APIs</li>
          <li><SiPostgresql /> PostgreSQL</li>
          <li><SiReact /> React</li>
          <li><SiJavascript /> TypeScript</li>
          <li><SiGit /> Git</li>
          <li><FaGithub /> GitHub</li>
          <li><SiDocker /> Docker (Basic Knowledge)</li>
          <li><TbTestPipe /> Mockito & JUnit</li>
        </ul>
      </div>
      {/* Profile image section */}
      <div className="profile">
        <img src={ProfilePic} alt="Carlos Keglevich Profile" /> {/* Profile image */}
      </div>
    </div>
  );
};

export default About;
