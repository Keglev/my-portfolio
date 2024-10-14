// src/App.js
import React from 'react';
// import Navbar from './components/Navbar';
import styled from 'styled-components';
// import Hero from './components/Hero';
import Projects from './components/Projects';
import Footer from './components/Footer';
import About from './components/About';
import Experience from './components/Experience'; // Import Experience section
import Sidebar from './components/Sidebar'; // Add a new Sidebar component
import { GlobalStyles } from './styles/GlobalStyles';

function App() {
  return (
    <>
      <GlobalStyles />
      <Container>
        <Sidebar />
        <MainContent id="scroll-container">
          <About />
          <Experience />
          <Projects />
          <Footer />
        </MainContent>
      </Container>
    </>
  );
}

export default App;

// Styled Components


const Container = styled.div`
  display: flex;
  height: 100vh; /* Ensures the layout covers the full viewport height */
`;

const MainContent = styled.div`
  flex: 1; /* The right side takes up the remaining width */
  overflow-y: auto; /* Enables scrolling on the right side */
  padding: 2rem;
  margin-left: 300px; /* Offset to accommodate the fixed sidebar */
  background-color: #0a192f;
  color: #ccd6f6;
`;
