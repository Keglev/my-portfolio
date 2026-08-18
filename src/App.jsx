/**
 * @file App.js
 * @module App
 * @summary Root application component; composes the fixed sidebar with the
 * scrollable main content column.
 * @enterprise Single-page portfolio: no router, no pages/ layer -- each
 * section (Hero/About/Skills/Projects/Contact/Legal) renders exactly once,
 * in the order the sidebar nav expects (SidebarMenu's NAV_ITEMS ids match
 * these section ids for react-scroll). Wraps everything in ThemeProvider so
 * every descendant can read the active theme. "./i18n" is imported for its
 * side effect only (i18next init) and must run before any translated
 * component renders.
 */
import React from 'react';
import './App.css';
import Projects from './components/Projects/Projects';
import About from './components/About/About';
import Sidebar from './components/Sidebar/Sidebar';
import Hero from './components/Hero/Hero';
import Skills from './components/Skills/Skills';
import Contact from './components/Contact/Contact';
import { ThemeProvider } from './context/ThemeContext';
import Legal from './components/Legal/Legal';
import { GlobalStyles } from './styles/GlobalStyles';
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Analytics } from "@vercel/analytics/react";
import "./i18n"; // must be imported before any translated component renders

/**
 * @returns {JSX.Element}
 */
function App() {
  return (
    <ThemeProvider>
      <SpeedInsights />
      <Analytics />
      <GlobalStyles />
      <div className="container">
        <Sidebar />
        {/* id matches the containerId prop used by react-scroll in SidebarMenu */}
        <div className="main-content" id="scroll-container">
          <div className="section" id="Hero"><Hero /></div>
          <div className="section" id="About"><About /></div>
          <div className="section" id="Skills"><Skills /></div>
          <div className="section" id="Projects"><Projects /></div>
          <div className="section" id="Contact"><Contact /></div>
          <div className="section" id="Legal"><Legal /></div>
        </div>
      </div>
    </ThemeProvider>
  );
}

export default App;
