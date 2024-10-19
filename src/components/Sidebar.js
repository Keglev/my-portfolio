import React, { useState } from 'react';
import styled from 'styled-components';
import { Link } from 'react-scroll'; // For smooth scrolling and spy
import { FaGithub, FaLinkedin, FaEnvelope } from 'react-icons/fa'; // Import icons

const Sidebar = () => {
  const [activeLink, setActiveLink] = useState('About'); // Default to 'About'

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
          spy={true} // Track scrolling
          activeClass="active" // Assign the "active" class when scrolling
          containerId="scroll-container" // Reference the scrollable container
          offset={-100} // Adjust for any header offset
          onSetActive={() => setActiveLink('About')} // Track active link
        >
          About
        </StyledLink>
        <StyledLink
          to="Experience"
          smooth={true}
          duration={500}
          spy={true} // Track scrolling
          activeClass="active" // Assign the "active" class when scrolling
          containerId="scroll-container" // Reference the scrollable container
          offset={-100} // Adjust for any header offset
          onSetActive={() => setActiveLink('Experience')} // Track active link
        >
          Experience
        </StyledLink>
        <StyledLink
          to="Projects"
          smooth={true}
          duration={500}
          spy={true} // Track scrolling
          activeClass="active" // Assign the "active" class when scrolling
          containerId="scroll-container" // Reference the scrollable container
          offset={-100} // Adjust for any header offset
          onSetActive={() => setActiveLink('Projects')} // Track active link
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

// Styled Components
const SidebarContainer = styled.div`
  width: 350px;
  height: 100vh;
  background-color: #0a192f;
  color: #ccd6f6;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  position: fixed;
  top: 0;
  left: 0;
`;

const NameTitle = styled.div`
  text-align: center;

  h1 {
    font-size: 2.5rem;
    margin-bottom: 0.5rem;
    color: #64ffda;
  }

  h2 {
    font-size: 1.4rem;
    color: #8892b0;
  }
`;

const Menu = styled.div`
  margin-top: 2rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const StyledLink = styled(Link)`
  display: flex;
  align-items: center;
  color: #ccd6f6;
  font-size: 1.4rem;
  cursor: pointer;
  text-decoration: none;
  transition: color 0.3s ease, font-size 0.3s ease;

  &:hover {
    color: #64ffda;
    font-size: 1.6rem; /* Slight increase in size */
  }

  &.active {
    color: #64ffda;
    font-size: 1.8rem; /* Increase size and brightness when active */
    font-weight: bold;
  }
`;

const SocialLinksWrapper = styled.div`
  margin-top: auto;
  margin-bottom: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const SocialLinks = styled.div`
  display: flex;
  gap: 1.5rem;

  a {
    font-size: 2rem;
    color: #ccd6f6;
    transition: color 0.3s ease, transform 0.3s ease;

    &:hover {
      color: #64ffda;
      transform: scale(1.2); /* Slightly increase the size */
    }
  }
`;

const FooterMessage = styled.div`
  margin-bottom: 2rem;
  text-align: center;
  font-size: 0.9rem;
  color: #8892b0;

  p {
    margin: 0;
  }
`;
