import React from 'react';
import './Experience.css'; // Importing the CSS file for styling

/**
 * The Experience component displays a list of professional experiences,
 * including the title, date, and a brief summary of each position.
 */
const Experience = () => {
  // Array containing experience data
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
    <div className="experience-container" id="Experience">
      {/* Heading for the experience section */}
      <h2>My Experience</h2>
      
      {/* Mapping through the experiences array and displaying each one */}
      <div className="experience-list">
        {experiences.map((exp, index) => (
          <div className="experience-card" key={index}>
            <h3>{exp.title}</h3>
            <p className="date">{exp.date}</p>
            <p>{exp.summary}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Experience;
