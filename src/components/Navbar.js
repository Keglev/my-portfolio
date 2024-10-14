// src/components/Navbar.js
import React from 'react';
import { Link } from 'react-scroll';
import { FaGithub, FaLinkedin } from 'react-icons/fa';
import styled from 'styled-components';

const Navbar = () => {
  return (
    <NavContainer>
      <Nav>
        <Logo>My Portfolio</Logo>
        <Menu>
          <Link to="projects" smooth={true} duration={500}>Projects</Link>
          <Link to="contact" smooth={true} duration={500}>Contact</Link>
        </Menu>
        <Icons>
          <a href="https://github.com/Keglev" target="_blank" rel="noopener noreferrer">
            <FaGithub />
          </a>
          <a href="https://linkedin.com/in/carloskeglevich" target="_blank" rel="noopener noreferrer">
            <FaLinkedin />
          </a>
        </Icons>
      </Nav>
    </NavContainer>
  );
};

export default Navbar;

const NavContainer = styled.div`
  width: 100%;
  background-color: #0a192f;
  position: fixed;
  top: 0;
  z-index: 10;
`;

const Nav = styled.nav`
  display: flex;
  justify-content: space-between;
  padding: 1rem 2rem;
  color: #64ffda;
`;

const Logo = styled.h1`
  font-size: 1.5rem;
`;

const Menu = styled.div`
  display: flex;
  gap: 2rem;
  
  a {
    color: #ccd6f6;
    text-decoration: none;
    font-size: 1rem;
    cursor: pointer;
    
    &:hover {
      color: #64ffda;
    }
  }
`;

const Icons = styled.div`
  a {
    color: #ccd6f6;
    font-size: 1.5rem;
    margin-left: 1rem;
    
    &:hover {
      color: #64ffda;
    }
  }
`;
