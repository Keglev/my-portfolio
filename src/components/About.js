// src/components/About.js
import React from 'react';
import styled from 'styled-components';
import ProfilePic from '../assets/profile-pic.jpg'; // Use a placeholder or your own picture
import { SiJavascript, SiReact, SiNodedotjs, SiAngular, SiPostgresql, SiMongodb, SiMysql, SiPython } from 'react-icons/si';
import { FaCoffee } from 'react-icons/fa';  // Use this as a Java icon


const About = () => {
  return (
    <AboutContainer id="About">
      <Content>
        <h2>About Me</h2>
        <p>
          Hello! My name is Carlos Keglevich, and I enjoy creating things that live on the internet. My
          interest in web development started back in 2023 when I decided to try building custom
          websites — turns out, I loved it and have been learning and building ever since.
        </p>
        <p>
          I have experience working with a variety of technologies and languages, and I'm always
          eager to learn and grow my skills. Whether I'm working on a complex web application or
          a fun side project, my focus is on building accessible, inclusive products and digital
          experiences that are both functional and visually appealing.
        </p>
        <p>
          Here are a few technologies I’ve been working with recently:
        </p>
        <TechList>
          <li><SiJavascript /> JavaScript (ES6+)</li>
          <li><SiReact /> React.js</li>
          <li><SiNodedotjs /> Node.js</li>
          <li><SiAngular /> Angular</li>
          <li><SiPostgresql /> PostgreSQL</li>
          <li><SiMongodb /> MongoDB</li>
          <li><SiMysql /> SQL</li>
        </TechList>
        <p>Adding to this, I am also learning how to develop cool back-end applications using:</p>
        <TechList>
          <li><SiPython /> Python </li>
          <li><FaCoffee /> Java </li>
        </TechList>
      </Content>
      <Profile>
        <img src={ProfilePic} alt="Profile" />
      </Profile>
    </AboutContainer>
  );
};

export default About;

// Styled Components
const AboutContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  text-align:center;
  padding: 5rem 2rem;
  background-color: #0a192f;
  color: #ccd6f6;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const Content = styled.div`
  max-width: 600px;

  h2 {
    color: #64ffda;
    font-size: 2rem;
    margin-bottom: 1.5rem;
  }

  p {
    margin-bottom: 1rem;
    font-size: 1rem;
    color: #8892b0;
    line-height: 1.5;
  }
`;

const TechList = styled.ul`
  display: grid;
  grid-template-columns: repeat(2, minmax(140px, 200px));
  gap: 0.5rem;
  margin-top: 1rem;
  list-style: none;
  color: #64ffda;

  li {
    font-size: 1rem;
    margin-bottom: 0.5rem;
    display: flex;
    align-items: center;

    svg {
      margin-right: 0.5rem;
      font-size: 1.5rem; /* Adjust the size of the icons */
      color: #64ffda;
    }
  }
`;

const Profile = styled.div`
  max-width: 300px;
  margin-left: 4rem;

  img {
    width: 100%; /* Ensures it fits the container */
    max-width: 250px; /* Controls max size */
    border-radius: 50%; /* Makes the image round */
    box-shadow: 0px 8px 15px rgba(0, 0, 0, 0.3); /* Initial shadow */
    border: 4px solid #64ffda; /* Bright light border */
    transition: transform 0.3s ease, box-shadow 0.3s ease, filter 0.3s ease; /* For smooth hover effect */

    &:hover {
      transform: scale(1.05); /* Slight zoom on hover */
      box-shadow: 0px 12px 20px rgba(0, 255, 150, 0.6); /* Larger shadow and green tint */
      filter: hue-rotate(160deg); /* Adds a greenish-blue tint */
    }
  }

  @media (max-width: 768px) {
    margin-left: 0;
    margin-top: 2rem;
    max-width: 250px;
  }
`;