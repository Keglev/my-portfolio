import React from 'react';
import './About.css'; // Import the CSS file for styling
import ProfilePic from '../../assets/profile-pic.jpg'; // Import the profile image
import { SiJavascript, SiReact, SiNodedotjs, SiPostgresql, SiSpringboot, SiGit, SiDocker } from 'react-icons/si'; // Import technology icons
import { TbTestPipe } from 'react-icons/tb'; // Import test pipe icon
import { FaJava, FaGithub } from 'react-icons/fa'; // Import Java and GitHub icons

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
          Hi! I'm Carlos Keglevich, a <strong>Backend Developer based in Germany</strong>. My journey into software development started in 2023 when I built my first custom website. Since then, I've been passionate about writing efficient code, solving complex problems, and building robust applications. 
        </p>
        <p>
          💻 <strong>My expertise lies in backend development</strong>, where I design and implement <strong>scalable, secure REST APIs</strong> using <strong>Java, Spring Boot, and PostgreSQL</strong>. I specialize in authentication, security (JWT, Spring Security), and database-driven applications.
        </p>
        <p>
          🔍 Coming from a background in <strong>manufacturing and business administration</strong>, I bring strong analytical thinking and problem-solving skills to my work. I enjoy translating <strong>business needs into technical solutions</strong> and building applications that make an impact.
        </p>
        <p>
          🚀 I am always eager to **learn and grow**—whether it’s optimizing backend performance, improving system security, or exploring new technologies.
        </p>
        <p>
          🎯 When I'm not coding, you'll find me enjoying a good coffee, exploring new technologies, or learning more about the latest backend frameworks.
        </p>
        {/* List of technologies the developer is skilled in */}
        <p>🔧 <strong>Tech Stack:</strong></p>
        <ul className="tech-list">
          <li><FaJava /> Java</li>
          <li><SiSpringboot /> Spring Boot</li>
          <li><SiNodedotjs /> REST APIs</li>
          <li><SiPostgresql /> PostgreSQL</li>
          <li><SiReact /> React</li>
          <li><SiJavascript /> TypeScript</li>
          <li><SiGit /> Git</li>
          <li><FaGithub /> GitHub</li>
          <li><SiDocker /> Docker (Basic Knowledge)</li>
          <li><TbTestPipe /> Mockito & JUnit</li>
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
