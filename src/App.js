import React from 'react';
import './App.css';
import Projects from './components/Projects/Projects';
import About from './components/About/About';
import Education from './components/Education/Education';
import Experience from './components/Experience/Experience';
import Sidebar from './components/Sidebar/Sidebar';
import RepoDocs from './components/RepoDocs/RepoDocs';
import Legal from './components/Legal/Legal';
import { GlobalStyles } from './styles/GlobalStyles';
import "./i18n"; // Initializes i18next with locale resources; must be imported before any translated component renders

/**
 * Root application component.
 * Renders the fixed sidebar alongside a scrollable main content area.
 * Section `id` attributes must stay in sync with sidebar navigation anchors for scroll-spy to work.
 */
function App() {
  return (
    <>
      {/* Injects CSS-in-JS global resets and theme variables into the document */}
      <GlobalStyles />

      <div className="container">
        {/* Fixed navigation sidebar; highlights the active section as the user scrolls */}
        <Sidebar />

        {/* `scroll-container` is the scroll target monitored by the sidebar's scroll-spy logic */}
        <div className="main-content" id="scroll-container">
          <div className="section" id="About">
            <About />
          </div>

          <div className="section" id="Education">
            <Education />
          </div>

          <div className="section" id="Projects">
            <Projects />
          </div>

          {/* Displays auto-fetched README documentation for pinned repositories */}
          <div className="section" id="RepoDocs">
            <RepoDocs />
          </div>

          <div className="section" id="Experience">
            <Experience />
          </div>

          {/* Impressum and Privacy Policy — required for legal compliance (GDPR) */}
          <div className="section" id="Legal">
            <Legal />
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
