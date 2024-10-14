// src/components/Sidebar.js
import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-scroll'; // For smooth scrolling

const Sidebar = () => {

  return (
    <SidebarContainer>
      <NameTitle>
        <h1>Carlos Keglevich</h1>
        <h2>Senior Software Engineer</h2>
      </NameTitle>
      <Menu>
        <StyledLink to="About" smooth={true} duration={500} containerId="scroll-container">About</StyledLink>
        <StyledLink to="Experience" smooth={true} duration={500} containerId="scroll-container">Experience</StyledLink>
        <StyledLink to="Projects" smooth={true} duration={500} containerId="scroll-container">Projects</StyledLink>
      </Menu>
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
  justify-content: center;
  align-items: center;
  position: fixed; /* Fixed on the left side */
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
  color: #ccd6f6;
  font-size: 1.4rem;
  cursor: pointer;
  text-decoration: none;

  &:hover {
    color: #64ffda;
  }
`;
