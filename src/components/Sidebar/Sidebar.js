import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  SidebarContainer,
  NameTitle,
  FooterMessage,
  LegalButton,
} from './SidebarStyles'; // Importing styled components from a separate file
import SidebarMenu from './SidebarMenu';
import SidebarSocial from './SidebarSocial';

import i18n from '../../i18n'; // Import i18n configuration

/**
 * Sidebar component that displays navigation links, social media icons, and contact information.
 * Tracks the active section based on the user's scroll position and highlights the corresponding link.
 */
const Sidebar = () => {
  const { t } = useTranslation(); // Translation function to translate text
  const [activeSection, setActiveSection] = useState('About'); // State to track the active section

  // Hook to update the active section based on the user's scroll position
  useEffect(() => {
    const handleScroll = () => {
  const projectsSection = document.getElementById('Projects');
  const experienceSection = document.getElementById('Experience');
  const repoDocsSection = document.getElementById('RepoDocs');
  const legalSection = document.getElementById('Legal');

      const scrollPosition = window.scrollY + window.innerHeight / 2; // Get scroll position relative to viewport height

      // Set the active section based on the scroll position
      if (legalSection && scrollPosition >= legalSection.offsetTop) {
        setActiveSection('Legal');
      } else if (repoDocsSection && scrollPosition >= repoDocsSection.offsetTop) {
        setActiveSection('RepoDocs');
      } else if (experienceSection && scrollPosition >= experienceSection.offsetTop) {
        setActiveSection('Experience');
      } else if (projectsSection && scrollPosition >= projectsSection.offsetTop) {
        setActiveSection('Projects');
      } else {
        setActiveSection('About');
      }
    };

    // Add scroll event listener when component mounts
    window.addEventListener('scroll', handleScroll);

    // Clean up the event listener when component unmounts
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <SidebarContainer>
      {/* Display name and title */}
      <NameTitle>
        <h1>{t('name')}</h1>
        <h2>{t('title')}</h2>
      </NameTitle>

      {/* Navigation menu */}
      <SidebarMenu activeSection={activeSection} changeLanguage={(lng) => changeLanguage(lng)} />

      <SidebarSocial />

      {/* Language switch moved into SidebarMenu */}

      {/* Footer message */}
      <FooterMessage>
        <p>{t('footerMessage')}</p>
        <div style={{ marginTop: '1rem' }}>
          <LegalButton
            type="button"
            aria-label="Jump to legal section"
            onClick={() => {
              const el = document.getElementById('Legal');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            {t('legalLink')}
          </LegalButton>
        </div>
      </FooterMessage>
    </SidebarContainer>
  );
};

export default Sidebar;
