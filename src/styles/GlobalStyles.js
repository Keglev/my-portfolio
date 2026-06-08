import { createGlobalStyle } from 'styled-components';

export const GlobalStyles = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: 'Montserrat', sans-serif;
    background-color: #0a192f;
    color: #ccd6f6;
    scroll-behavior: smooth;
    line-height: 1.6;
  }

  h1, h2, h3, h4, h5, h6 {
    margin: 0;
    font-weight: 700;
  }

  p {
    margin: 0;
  }

  @media (max-width: 768px) {
    body {
      padding: 0 1rem;
    }
  }
`;
