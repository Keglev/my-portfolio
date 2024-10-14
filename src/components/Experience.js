// src/components/Experience.js
import React from 'react';
import styled from 'styled-components';

const Experience = () => {
  return (
    <ExperienceContainer id="Experience">
      <h2>My Experience</h2>
      <p>Here is where I will describe my professional experience and skills.</p>
    </ExperienceContainer>
  );
};

export default Experience;

// Styled Components
const ExperienceContainer = styled.div`
  padding: 5rem 2rem;
  background-color: #0a192f;
  color: #ccd6f6;
  text-align: center;

  h2 {
    font-size: 2rem;
    color: #64ffda;
    margin-bottom: 1.5rem;
  }

  p {
    font-size: 1.2rem;
    color: #8892b0;
    max-width: 600px;
    margin: 0 auto;
  }
`;
