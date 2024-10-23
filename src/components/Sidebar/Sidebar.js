import React, { useState, useEffect } from 'react';
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

/**
 * Sidebar component that displays navigation links, social media icons, and contact information.
 * Tracks the active section based on the user's scroll position and highlights the corresponding link.
 */
const Sidebar = () => {
  const [activeSection, setActiveSection] = useState('About'); // State to track the active section

  // Hook to update the active section based on the user's scroll position
  useEffect(() => {
    const handleScroll = () => {
      const aboutSection = document.getElementById('About');
      const experienceSection = document.getElementById('Experience');
      const projectsSection = document.getElementById('Projects');

      const scrollPosition = window.scrollY + window.innerHeight / 2; // Get scroll position relative to viewport height

      // Set the active section based on the scroll position
      if (projectsSection && scrollPosition >= projectsSection.offsetTop) {
        setActiveSection('Projects');
      } else if (experienceSection && scrollPosition >= experienceSection.offsetTop) {
        setActiveSection('Experience');
      } else if (aboutSection && scrollPosition >= aboutSection.offsetTop) {
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

  return (
    <SidebarContainer>
      {/* Display name and title */}
      <NameTitle>
        <h1>Carlos Keglevich</h1>
        <h2>Software Engineer</h2>
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
          About
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
          Experience
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
          Projects
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

      {/* Footer message */}
      <FooterMessage>
        <p>Designed & Built by Carlos Keglevich</p>
      </FooterMessage>
    </SidebarContainer>
  );
};

export default Sidebar;
