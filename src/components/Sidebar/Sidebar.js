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
} from './SidebarStyles';

const Sidebar = () => {
  const [activeSection, setActiveSection] = useState('About'); // Track the active section

  // Update the active section based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      const aboutSection = document.getElementById('About');
      const experienceSection = document.getElementById('Experience');
      const projectsSection = document.getElementById('Projects');

      const scrollPosition = window.scrollY + window.innerHeight / 2;

      if (projectsSection && scrollPosition >= projectsSection.offsetTop) {
        setActiveSection('Projects');
      } else if (experienceSection && scrollPosition >= experienceSection.offsetTop) {
        setActiveSection('Experience');
      } else if (aboutSection && scrollPosition >= aboutSection.offsetTop) {
        setActiveSection('About');
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <SidebarContainer>
      <NameTitle>
        <h1>Carlos Keglevich</h1>
        <h2>Software Engineer</h2>
      </NameTitle>
      <Menu>
        <StyledLink
          to="About"
          smooth={true}
          duration={500}
          spy={true}
          activeClass={activeSection === 'About' ? 'active' : ''}
          containerId="scroll-container"
          offset={70}
        >
          About
        </StyledLink>
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

      <FooterMessage>
        <p>Designed & Built by Carlos Keglevich</p>
      </FooterMessage>
    </SidebarContainer>
  );
};

export default Sidebar;
