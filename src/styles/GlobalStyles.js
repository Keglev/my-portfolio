// src/styles/GlobalStyles.js
import { createGlobalStyle } from 'styled-components';

export const GlobalStyles = createGlobalStyle`
  body {
    margin: 0;
    padding: 0;
    font-family: 'Arial', sans-serif;
    background-color: #0a192f;
    color: #ccd6f6;
  }

  *, *::before, *::after {
    box-sizing: border-box;
  }
`;
