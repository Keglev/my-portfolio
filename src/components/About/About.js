import React from 'react';
import './About.css'; // Import the CSS file for styling
import ProfilePic from '../../assets/profile-pic.jpg'; // Import the profile image
import { SiJavascript, SiReact, SiNodedotjs, SiAngular, SiPostgresql, SiMongodb, SiMysql, SiPython } from 'react-icons/si'; // Import technology icons
import { FaCoffee } from 'react-icons/fa'; // Import Java icon

/**
 * The About component renders information about the developer
 * and showcases the technologies they are proficient in.
 */
const About = () => {
  return (
    <div className="about-container" id="About">
      {/* Content section */}
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
        {/* List of technologies the developer is skilled in */}
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
        {/* Additional technologies the developer is learning */}
        <p>Adding to this, I am also learning how to develop cool back-end applications using:</p>
        <ul className="tech-list">
          <li><SiPython /> Python</li>
          <li><FaCoffee /> Java</li>
        </ul>
      </div>
      {/* Profile image section */}
      <div className="profile">
        <img src={ProfilePic} alt="Carlos Keglevich Profile" /> {/* Profile image */}
      </div>
    </div>
  );
};

export default About;
