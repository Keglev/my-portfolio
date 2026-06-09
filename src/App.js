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
import { SpeedInsights } from "@vercel/speed-insights/react";
import "./i18n"; // must be imported before any translated component renders

/**
 * Root application component.
 * Composes the fixed sidebar with the scrollable main content column.
 *
 * @returns {JSX.Element}
 */
function App() {
  return (
    <>
      <SpeedInsights />
      <GlobalStyles />
      <div className="container">
        <Sidebar />
        {/* id matches the containerId prop used by react-scroll in SidebarMenu */}
        <div className="main-content" id="scroll-container">
          <div className="section" id="About"><About /></div>
          <div className="section" id="Education"><Education /></div>
          <div className="section" id="Projects"><Projects /></div>
          <div className="section" id="RepoDocs"><RepoDocs /></div>
          <div className="section" id="Experience"><Experience /></div>
          <div className="section" id="Legal"><Legal /></div>
        </div>
      </div>
    </>
  );
}

export default App;
