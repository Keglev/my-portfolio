import React from 'react';
import './App.css'; // Import the CSS file for styles
import Projects from './components/Projects/Projects';
import About from './components/About/About';
import Experience from './components/Experience/Experience';
import Sidebar from './components/Sidebar/Sidebar';
import { GlobalStyles } from './styles/GlobalStyles';

function App() {
  return (
    <>
      <GlobalStyles />
      <div className="container">
        <Sidebar />
        <div className="main-content" id="scroll-container">
          <div className="section" id="About">
            <About />
          </div>
          <div className="section" id="Experience">
            <Experience />
          </div>
          <div className="section" id="Projects">
            <Projects />
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
