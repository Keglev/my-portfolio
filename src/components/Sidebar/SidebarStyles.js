import styled from 'styled-components';
import { Link } from 'react-scroll';

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
    transform: translateX(10px); /* Shift to the right on hover or when active */
    color: #64ffda;
  }
`;

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

export const Menu = styled.div`
  margin-top: 2rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;

  @media (max-width: 768px) {
    display: none; /* Hide menu on smaller screens */
  }
`;

export const SocialLinksWrapper = styled.div`
  margin-top: auto;
  margin-bottom: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

export const SocialLinks = styled.div`
  display: flex;
  gap: 1.5rem;

  a {
    font-size: 2rem;
    color: #ccd6f6;
    transition: color 0.3s ease, transform 0.3s ease;

    &:hover {
      color: #64ffda;
      transform: scale(1.2);
    }
  }

  @media (max-width: 768px) {
    gap: 1rem;

    a {
      font-size: 1.5rem;
    }
  }
`;

export const FooterMessage = styled.div`
  margin-bottom: 2rem;
  text-align: center;
  font-size: 0.9rem;
  color: #8892b0;

  p {
    margin: 0;
  }

  @media (max-width: 768px) {
    font-size: 0.8rem;
  }
`;
