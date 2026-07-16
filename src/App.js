import React from 'react';
import './App.css';
import Projects from './components/Projects/Projects';
import About from './components/About/About';
import Education from './components/Education/Education';
import Experience from './components/Experience/Experience';
import Sidebar from './components/Sidebar/Sidebar';
import Hero from './components/Hero/Hero';
import Skills from './components/Skills/Skills';
import Contact from './components/Contact/Contact';
import { ThemeProvider } from './context/ThemeContext';
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
    <ThemeProvider>
      <SpeedInsights />
      <GlobalStyles />
      <div className="container">
        <Sidebar />
        {/* id matches the containerId prop used by react-scroll in SidebarMenu */}
        <div className="main-content" id="scroll-container">
          <div className="section" id="Hero"><Hero /></div>
          <div className="section" id="About"><About /></div>
          <div className="section" id="Education"><Education /></div>
          <div className="section" id="Skills"><Skills /></div>
          <div className="section" id="Projects"><Projects /></div>
          <div className="section" id="RepoDocs"><RepoDocs /></div>
          <div className="section" id="Experience"><Experience /></div>
          <div className="section" id="Contact"><Contact /></div>
          <div className="section" id="Legal"><Legal /></div>
        </div>
      </div>
    </ThemeProvider>
  );
}

export default App;
