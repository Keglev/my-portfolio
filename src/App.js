import React from 'react';
import './App.css'; // Import the CSS file for custom styles
import Projects from './components/Projects/Projects'; // Import Projects component
import About from './components/About/About'; // Import About component
import Experience from './components/Experience/Experience'; // Import Experience component
import Sidebar from './components/Sidebar/Sidebar'; // Import Sidebar component
import { GlobalStyles } from './styles/GlobalStyles'; // Import global styles

function App() {
  return (
    <>
      {/* Apply global styles to the entire app */}
      <GlobalStyles />

      {/* Container that holds both the sidebar and main content */}
      <div className="container">
        {/* Sidebar component for navigation */}
        <Sidebar />

        {/* Main content area with scrolling container */}
        <div className="main-content" id="scroll-container">
          {/* Section for About component */}
          <div className="section" id="About">
            <About />
          </div>

          {/* Section for Experience component */}
          <div className="section" id="Experience">
            <Experience />
          </div>

          {/* Section for Projects component */}
          <div className="section" id="Projects">
            <Projects />
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
