import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FaGithub, FaLinkedin, FaEnvelope } from 'react-icons/fa';
import {
  SidebarContainer,
  NameTitle,
  Menu,
  StyledLink,
  SocialLinksWrapper,
  SocialLinks,
  FooterMessage,
} from './SidebarStyles'; // Importing styled components from a separate file
import LanguageButtons from '../LanguageButtons/LanguageButtons'; // Import LanguageButtons component

import i18n from '../../i18n'; // Import i18n configuration

/**
 * Sidebar component that displays navigation links, social media icons, and contact information.
 * Tracks the active section based on the user's scroll position and highlights the corresponding link.
 */
const Sidebar = () => {
  const { t } = useTranslation(); // Translation function to translate text
  const [activeSection, setActiveSection] = useState('About'); // State to track the active section

  // Hook to update the active section based on the user's scroll position
  useEffect(() => {
    const handleScroll = () => {
      const projectsSection = document.getElementById('Projects');
      const experienceSection = document.getElementById('Experience');

      const scrollPosition = window.scrollY + window.innerHeight / 2; // Get scroll position relative to viewport height

      // Set the active section based on the scroll position
      if (experienceSection && scrollPosition >= experienceSection.offsetTop) {
        setActiveSection('Experience');
      } else if (projectsSection && scrollPosition >= projectsSection.offsetTop) {
        setActiveSection('Projects');
      } else {
        setActiveSection('About');
      }
    };

    // Add scroll event listener when component mounts
    window.addEventListener('scroll', handleScroll);

    // Clean up the event listener when component unmounts
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <SidebarContainer>
      {/* Display name and title */}
      <NameTitle>
        <h1>{t('name')}</h1>
        <h2>{t('title')}</h2>
      </NameTitle>

      {/* Navigation menu */}
      <Menu>
        {/* Link to "About" section, highlights when active */}
        <StyledLink
            to="About"
            smooth={true}
            duration={500}
            spy={true}
            activeClass={activeSection === 'About' ? 'active' : ''}
            containerId="scroll-container"
            offset={70} // Adjust the offset value to handle fixed header
        >
            {t('about')}
        </StyledLink>

         {/* Link to "Projects" section */}
         <StyledLink
            to="Projects"
            smooth={true}
            duration={500}
            spy={true}
            activeClass={activeSection === 'Projects' ? 'active' : ''}
            containerId="scroll-container"
            offset={70}
        >
            {t('projects')}
        </StyledLink>
        
        {/* Link to "Experience" section */}
        <StyledLink
            to="Experience"
            smooth={true}
            duration={500}
            spy={true}
            activeClass={activeSection === 'Experience' ? 'active' : ''}
            containerId="scroll-container"
            offset={70}
        >
            {t('experience')}
        </StyledLink>
      </Menu>

      {/* Social media links */}
      <SocialLinksWrapper>
        <SocialLinks>
          <a href="https://github.com/keglev" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
            <FaGithub />
          </a>
          <a href="https://linkedin.com/in/carloskeglevich" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
            <FaLinkedin />
          </a>
          <a href="mailto:carlos.keglevich@gmail.com" target="_blank" rel="noopener noreferrer" aria-label="Email">
            <FaEnvelope />
          </a>
        </SocialLinks>
      </SocialLinksWrapper>

       {/* Language Switch Buttons */}
       <div style={{ marginBottom: '2rem' }}>
        <LanguageButtons>
          <button onClick={() => changeLanguage('en')}>{t('language.english')}</button>
          <button onClick={() => changeLanguage('de')}>{t('language.german')}</button>
        </LanguageButtons>
      </div>

      {/* Footer message */}
      <FooterMessage>
        <p>Designed & Built by Carlos Keglevich</p>
      </FooterMessage>
    </SidebarContainer>
  );
};

export default Sidebar;
