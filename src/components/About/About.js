// src/components/About/About.js
import React from 'react';
import './About.css'; // Importing the CSS file
import ProfilePic from '../../assets/profile-pic.jpg'; // Adjust path based on your project structure
import { SiJavascript, SiReact, SiNodedotjs, SiAngular, SiPostgresql, SiMongodb, SiMysql, SiPython } from 'react-icons/si';
import { FaCoffee } from 'react-icons/fa';  // Use this as a Java icon

const About = () => {
  return (
    <div className="about-container" id="About">
      <div className="content">
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
        <p>Here are a few technologies I’ve been working with recently:</p>
        <ul className="tech-list">
          <li><SiJavascript /> JavaScript (ES6+)</li>
          <li><SiReact /> React.js</li>
          <li><SiNodedotjs /> Node.js</li>
          <li><SiAngular /> Angular</li>
          <li><SiPostgresql /> PostgreSQL</li>
          <li><SiMongodb /> MongoDB</li>
          <li><SiMysql /> SQL</li>
        </ul>
        <p>Adding to this, I am also learning how to develop cool back-end applications using:</p>
        <ul className="tech-list">
          <li><SiPython /> Python</li>
          <li><FaCoffee /> Java</li>
        </ul>
      </div>
      <div className="profile">
        <img src={ProfilePic} alt="Profile" />
      </div>
    </div>
  );
};

export default About;
