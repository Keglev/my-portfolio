// src/components/Hero.js
import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-scroll'; // Import Link for smooth scrolling

const Hero = () => {
  return (
    <HeroContainer>
      <h1>Hello, I'm Carlos Keglevich</h1>
      <h2>I'm a software engineer building cool stuff.</h2>
      <p>Check out my projects below.</p>
      {/* Submenu for navigating between sections */}
      <Submenu>
        <StyledLink to="about" smooth={true} duration={500}>About</StyledLink>
        <StyledLink to="experience" smooth={true} duration={500}>Experience</StyledLink>
        <StyledLink to="projects" smooth={true} duration={500}>Projects</StyledLink>
      </Submenu>
    </HeroContainer>
  );
};

export default Hero;

const HeroContainer = styled.div`
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 0 2rem;
  background-color: #0a192f;
  color: #ccd6f6;
  
  h1 {
    font-size: 3rem;
    text-align: center;
  }

  h2 {
    font-size: 2rem;
    color: #64ffda;
    text-align: center;
  }

  p {
    font-size: 1.2rem;
    color: #8892b0;
    text-align: center;
  }
`;

// Submenu for About, Experience, and Projects links
const Submenu = styled.div`
  margin-top: 2rem;
  display: flex;
  gap: 2rem;
`;

const StyledLink = styled(Link)`
  color: #64ffda;
  font-size: 1.2rem;
  text-decoration: none;
  cursor: pointer;

  &:hover {
    color: #ccd6f6;
  }
`;
