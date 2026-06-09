import React from 'react';
import './About.css';
import ProfilePic from '../../assets/profile-pic.jpg';
import { SiReact, SiPostgresql, SiSpringboot, SiDocker, SiTypescript, SiMaterialdesign, SiGit, SiVite } from 'react-icons/si';
import { FaJava, FaGithub, FaShieldAlt } from 'react-icons/fa';
import { TbTestPipe } from 'react-icons/tb';
import { useTranslation } from 'react-i18next';

/**
 * Renders developer profile and technology stack.
 * Displays introductory text from i18n resources alongside a profile picture
 * and icons for key technical skills grouped into categories.
 *
 * @returns {JSX.Element} About section with profile image, biography text, and tech stack icons.
 */
const About = () => {
  const { t } = useTranslation();
  return (
    <div className="about-container" id="About">
      <div className="content">
        <h2>{t('aboutSection.heading')}</h2>
        <p>{t('aboutSection.description1')}</p>
        <p>{t('aboutSection.description2')}</p>
        <p>{t('aboutSection.description3')}</p>
      
        {/* Grouped by domain: backend, frontend, devops */}
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
      <div className="profile">
        <img src={ProfilePic} alt="Carlos Keglevich Profile" />
      </div>
    </div>
  );
};

export default About;
