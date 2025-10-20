import styled from 'styled-components';
import { Link } from 'react-scroll'; // Importing Link from react-scroll for smooth scrolling

/**
 * Styled container for the sidebar
 */
export const SidebarContainer = styled.div`
  width: 350px;
  height: 100vh;
  background-color: #0a192f;
  color: #ccd6f6;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  position: fixed;
  top: 0;
  left: 0;

  @media (max-width: 768px) {
    width: 100%;
    height: auto;
    position: relative;
  }
`;

/**
 * Styled link component for navigation, includes hover and active state
 */
export const StyledLink = styled(Link)`
  display: flex;
  align-items: center;
  color: #ccd6f6;
  font-size: 1.4rem;
  cursor: pointer;
  text-decoration: none;
  transition: transform 0.3s ease, color 0.3s ease;

  &:hover,
  &.active {
    transform: translateX(10px); /* Shift to the right when hovered or active */
    color: #64ffda; /* Highlight color */
  }
`;

/**
 * Name and title section styling
 */
export const NameTitle = styled.div`
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

  @media (max-width: 768px) {
    h1 {
      font-size: 1.8rem;
    }

    h2 {
      font-size: 1.2rem;
    }
  }
`;

/**
 * Menu wrapper for the links
 */
export const Menu = styled.div`
  margin-top: 2rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;

  @media (max-width: 768px) {
    display: none; /* Hide menu on smaller screens */
  }
`;

/**
 * Wrapper for social links like GitHub, LinkedIn, and Email
 */
export const SocialLinksWrapper = styled.div`
  margin-top: auto;
  margin-bottom: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

/**
 * Social links container with hover effects
 */
export const SocialLinks = styled.div`
  display: flex;
  gap: 1.5rem;

  a {
    font-size: 2rem;
    color: #ccd6f6;
    transition: color 0.3s ease, transform 0.3s ease;

    &:hover {
      color: #64ffda; /* Change color on hover */
      transform: scale(1.2); /* Slight zoom effect */
    }
  }

  @media (max-width: 768px) {
    gap: 1rem;

    a {
      font-size: 1.5rem;
    }
  }
`;

/**
 * Footer message at the bottom of the sidebar
 */
export const FooterMessage = styled.div`
  margin-bottom: 2rem;
  text-align: center;
  font-size: 0.9rem;
  color: #ccd6f6;

  p {
    margin: 0;
  }

  @media (max-width: 768px) {
    font-size: 0.8rem;
  }
`;

/**
 * Wrapper for language buttons area
 */
export const LanguageWrapper = styled.div`
  margin-bottom: 2rem;
  display: flex;
  gap: 0.5rem;
  button {
    background: transparent;
    border: 1px solid rgba(204,214,246,0.08);
    color: #ccd6f6;
    padding: 0.4rem 0.6rem;
    border-radius: 4px;
    cursor: pointer;
    transition: background 0.15s ease, color 0.15s ease, transform 0.08s ease;
  }
  button:hover {
    background: rgba(100,255,218,0.06);
    color: #64ffda;
    transform: translateY(-1px);
  }
`;

export const LegalButton = styled.button`
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  color: inherit;
  text-decoration: underline;
  font: inherit;
`;
