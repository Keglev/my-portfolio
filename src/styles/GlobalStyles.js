import { createGlobalStyle } from 'styled-components';

// Global styles applied to the entire app
export const GlobalStyles = createGlobalStyle`
  /* Reset default margins and paddings for all elements */
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box; /* Ensure padding doesn't affect element width */
  }

  /* Basic body styles */
  body {
    font-family: 'Montserrat', sans-serif; /* Use Montserrat font */
    background-color: #0a192f; /* Set background color */
    color: #ccd6f6; /* Set default text color */
    scroll-behavior: smooth; /* Smooth scrolling for anchor links */
    line-height: 1.6; /* Comfortable line height for text */
  }

  /* Heading styles */
  h1, h2, h3, h4, h5, h6 {
    margin: 0; /* Remove default margins */
    font-weight: 700; /* Make all headings bold */
  }

  /* Paragraph styles */
  p {
    margin: 0; /* Remove default margins */
  }

  /* Responsive adjustments for smaller screens */
  @media (max-width: 768px) {
    body {
      padding: 0 1rem; /* Add padding on smaller screens */
    }
  }
`;
