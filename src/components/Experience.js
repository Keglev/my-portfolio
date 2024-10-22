import React from 'react';
import styled from 'styled-components';

const Experience = () => {
  const experiences = [
    {
      title: 'Full Stack Developer Course - Dio (online)',
      date: '10.2023 – Present',
      summary: 'Developed personal projects including a portfolio website, BuzzFeed app, and restaurant finder app, integrating React, Angular, GraphQL, and Google APIs.',
    },
    {
      title: 'Duagon GmbH, Electronics Factory',
      date: '04.2023 - Present',
      summary: 'Ensured high-quality production standards, improved processes, and reduced quality issues by 25% through analysis and task management.',
    },
    {
      title: 'Buyer, K&K Brands',
      date: '03.2019 – 09.2021',
      summary: 'Increased profits by 18% through research-driven pricing decisions and procurement strategies.',
    },
    {
      title: 'Production Worker, Alcon-Novartis',
      date: '02.2018 – 12.2018',
      summary: 'Improved production output by 45% through process analysis and implementing new strategies.',
    },
  ];

  return (
    <ExperienceContainer id="Experience">
      <h2>My Experience</h2>
      <ExperienceList>
        {experiences.map((exp, index) => (
          <ExperienceCard key={index}>
            <h3>{exp.title}</h3>
            <p className="date">{exp.date}</p>
            <p>{exp.summary}</p>
          </ExperienceCard>
        ))}
      </ExperienceList>
    </ExperienceContainer>
  );
};

export default Experience;

// Styled Components
const ExperienceContainer = styled.div`
  padding: 5rem 2rem;
  background-color: #0a192f;
  color: #ccd6f6;

  h2 {
    font-size: 2rem;
    color: #64ffda;
    margin-bottom: 2rem;
    text-align: center;
  }

   @media (max-width: 768px) {
    padding: 2rem 1rem;
  }
`;

const ExperienceList = styled.div`
  display: flex;
  flex-direction: column;  /* Aligns boxes top-down */
  gap: 1.5rem;
`;

const ExperienceCard = styled.div`
  background-color: #112240;
  padding: 1.5rem;
  border-radius: 8px;
  transition: background-color 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    background-color: #1f4068;
    box-shadow: 0px 8px 15px rgba(0, 255, 150, 0.5);
  }

  h3 {
    color: #64ffda;
    margin-bottom: 0.5rem;
  }

  .date {
    color: #8892b0;
    font-size: 0.9rem;
    margin-bottom: 1rem;
  }

  p {
    color: #ccd6f6;
  }
     @media (max-width: 768px) {
    padding: 1rem;
    h3 {
      font-size: 1.2rem;
    }
    p, .date {
      font-size: 0.9rem;
    }
  }
`;
