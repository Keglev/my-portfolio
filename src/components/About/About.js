import React from 'react';
import './About.css'; // Import the CSS file for styling
import ProfilePic from '../../assets/profile-pic.jpg'; // Import the profile image
import { SiReact, SiPostgresql, SiSpringboot, SiSpringsecurity, SiGit, SiDocker, SiOpenapiinitiative, SiOracle, SiVite, SiMaterialdesign, SiTailwindcss, SiReactquery, SiReacthookform, SiAxios, SiReactrouter, SiVitest, SiGraphql, SiTypescript } from 'react-icons/si'; // Import technology icons
import { FaJava, FaGithub, FaTools, FaGlobe, FaCode, FaDatabase } from 'react-icons/fa'; // Import Java, GitHub, Tools and other icons
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
      
        {/* List of technologies the developer is skilled in */}
        <p>🔧 <strong>Tech Stack:</strong></p>
        <ul className="tech-list">
          {/* Backend */}
          <li><FaJava /> Java 17+</li>
          <li><SiSpringboot /> Spring Boot 3.5+</li>
          <li><SiSpringsecurity /> Spring Security (OAuth2, JWT)</li>
          <li><FaTools /> Maven</li>
          <li><TbTestPipe /> JUnit & Mockito</li>
          <li><SiOpenapiinitiative /> OpenAPI (API Docs)</li>

          {/* Database */}
          <li><SiPostgresql /> PostgreSQL</li>
          <li><SiOracle /> Oracle Autonomous DB</li>

          {/* DevOps */}
          <li><SiDocker /> Docker & Docker Compose</li>
          <li><FaGithub /> GitHub Actions (CI/CD)</li>
          <li><SiGit /> Git</li>

          {/* Frontend / React / TypeScript */}
          <li><SiReact /> React 19</li>
          <li><SiTypescript /> TypeScript</li>
          <li><SiVite /> Vite</li>
          <li><SiMaterialdesign /> Material UI (MUI)</li>
          <li><SiTailwindcss /> Tailwind CSS</li>
          <li><SiReactquery /> React Query</li>
          <li><SiReacthookform /> React Hook Form</li>
          <li><SiAxios /> Axios</li>
          <li><SiReactrouter /> React Router</li>
          <li><SiVitest /> Vitest & React Testing Library</li>
          <li><FaGlobe /> i18next (Internationalization)</li>

          {/* Other Tools */}
          <li><FaCode /> Lombok</li>
          <li><FaDatabase /> Hibernate / JPA</li>
          <li><SiGraphql /> GraphQL (GitHub API)</li>
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
