import React from 'react';
import './About.css'; // Import the CSS file for styling
import ProfilePic from '../../assets/profile-pic.jpg'; // Import the profile image
import { SiReact, SiPostgresql, SiSpringboot, SiDocker, SiTypescript, SiMaterialdesign, SiGit, SiVite } from 'react-icons/si'; // Import technology icons
import { FaJava, FaGithub, FaShieldAlt } from 'react-icons/fa'; // Import Java, GitHub and Shield icons
import { TbTestPipe } from 'react-icons/tb'; // test pipe icon for JUnit/Mockito
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
      
        {/* Shorter tech lists — grouped */}
        <p>🔧 <strong>Tech Stack:</strong></p>
        <ul className="tech-list">
          <li><FaJava /> Java 17</li>
          <li><SiSpringboot /> Spring Boot 3</li>
          <li><SiPostgresql /> PostgreSQL & Oracle DB</li>
          <li><SiDocker /> Docker & Docker Compose</li>
        </ul>

        <ul className="tech-list">
          <li><TbTestPipe /> JUnit & Mockito</li>
          <li><SiTypescript /> TypeScript</li>
          <li><SiReact /> React.js</li>
          <li><SiMaterialdesign /> Material-UI (MUI)</li>
        </ul>

        <ul className="tech-list">
          <li><SiGit /> Git</li>
          <li><FaGithub /> GitHub Actions</li>
          <li><FaShieldAlt /> Security / Auth</li>
          <li><SiVite /> Vite</li>
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
