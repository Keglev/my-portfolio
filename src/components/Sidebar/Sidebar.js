import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  SidebarContainer,
  NameTitle,
  FooterMessage,
  LegalButton,
} from './SidebarStyles';
import SidebarMenu from './SidebarMenu';
import SidebarSocial from './SidebarSocial';

// Ordered bottom-to-top so the first match is always the deepest section currently in view
const SECTIONS = ['Legal', 'RepoDocs', 'Experience', 'Projects', 'Education'];

/**
 * Returns the id of the section currently most visible in the viewport.
 * Iterates from bottom to top so the deepest section the user has scrolled past wins.
 *
 * @param {number} scrollPosition - window.scrollY plus half the viewport height
 * @returns {string} Section id, defaulting to 'About' when scroll is near the top
 */
const getActiveSection = (scrollPosition) => {
  for (const id of SECTIONS) {
    const el = document.getElementById(id);
    if (el && scrollPosition >= el.offsetTop) return id;
  }
  return 'About';
};

/**
 * Fixed left-hand navigation sidebar.
 * Tracks the active section via scroll position and exposes language switching,
 * CV download, and links to German legal pages.
 *
 * @returns {JSX.Element}
 */
const Sidebar = () => {
  const { t } = useTranslation();
  const [activeSection, setActiveSection] = useState('About');

  useEffect(() => {
    const handleScroll = () => {
      // Midpoint of the viewport keeps the active item stable as the user scrolls through sections
      const scrollPosition = window.scrollY + window.innerHeight / 2;
      setActiveSection(getActiveSection(scrollPosition));
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <SidebarContainer>
      <NameTitle>
        <h1>{t('name')}</h1>
        <h2>{t('title')}</h2>
      </NameTitle>
      <SidebarMenu activeSection={activeSection} />
      <SidebarSocial />
      <FooterMessage>
        <p>{t('footerMessage')}</p>
        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <LegalButton
            type="button"
            aria-label="Jump to Impressum section"
            onClick={() => document.getElementById('Impressum')?.scrollIntoView({ behavior: 'smooth' })}
          >
            {t('impressumLink')}
          </LegalButton>
          <span style={{ color: 'var(--color-text-muted)' }}>|</span>
          <LegalButton
            type="button"
            aria-label="Jump to privacy policy section"
            onClick={() => document.getElementById('Datenschutz')?.scrollIntoView({ behavior: 'smooth' })}
          >
            {t('datenschutzLink')}
          </LegalButton>
        </div>
      </FooterMessage>
    </SidebarContainer>
  );
};

export default Sidebar;
