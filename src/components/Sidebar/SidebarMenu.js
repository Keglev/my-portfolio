/**
 * @file SidebarMenu.js
 * @module components/Sidebar/SidebarMenu
 * @summary Sidebar navigation links, language switcher, and CV download button.
 * @enterprise NAV_ITEMS ids must match the section wrapper ids in App.js
 * exactly (react-scroll's `to` prop targets them by id). CV file selection
 * delegates to data/cvAssets.config, the single source of truth shared
 * with Hero's own CV link. The DE|EN language labels are deliberately
 * hardcoded literals, not i18n keys -- they name the language itself, so
 * translating "DE" through i18n would be circular. cvLabel, by contrast,
 * is real UI copy hardcoded per-language rather than routed through i18n;
 * unlike the language labels this is inconsistent with the rest of the
 * codebase, but left as-is here since fixing it is outside the CV-asset
 * dedup this file just received.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Menu, StyledLink, LanguageWrapper, CVDownloadWrapper, CVDownloadLink } from './SidebarStyles';
import { useTheme } from '../../context/ThemeContext';
import { getCvFile } from '../../data/cvAssets.config';

const NAV_ITEMS = [
  { id: 'About',    key: 'about' },
  { id: 'Skills',   key: 'skills' },
  { id: 'Projects', key: 'projects' },
  { id: 'Contact',  key: 'contact' },
];

/**
 * @param {string} activeSection - Id of the section currently in view
 * @returns {JSX.Element}
 */
const SidebarMenu = ({ activeSection }) => {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();

  const cvFile = getCvFile(i18n.language);
  const cvLabel = i18n.language === 'de' ? 'Lebenslauf herunterladen' : 'Download Resume';

  return (
    <>
      <Menu>
        {NAV_ITEMS.map(({ id, key }) => (
          <StyledLink
            key={id}
            to={id}
            smooth={true}
            duration={500}
            spy={true}
            activeClass={activeSection === id ? 'active' : ''}
            containerId="scroll-container"
            // The sidebar is static on mobile (no fixed top bar), so we stop
            // slightly BEFORE the heading instead of scrolling past it
            offset={-10}
          >
            {t(key)}
          </StyledLink>
        ))}
      </Menu>

      <LanguageWrapper role="group" aria-label="Language switch">
        {/* Compact DE | EN text switch (flags are ambiguous for languages); active one is accented */}
        <button
          onClick={() => i18n.changeLanguage('de')}
          aria-label="Auf Deutsch umschalten"
          aria-pressed={i18n.language.startsWith('de')}
        >
          DE
        </button>
        <button
          onClick={() => i18n.changeLanguage('en')}
          aria-label="Switch to English"
          aria-pressed={!i18n.language.startsWith('de')}
        >
          EN
        </button>
        <button
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          title={theme === 'dark' ? t('theme.light', 'Light theme') : t('theme.dark', 'Dark theme')}
        >
          {theme === 'dark' ? '☀' : '☾'}
        </button>
      </LanguageWrapper>

      <CVDownloadWrapper>
        <CVDownloadLink
          href={cvFile}
          download
          target="_blank"
          rel="noopener noreferrer"
          aria-label={cvLabel}
        >
          {cvLabel}
        </CVDownloadLink>
      </CVDownloadWrapper>
    </>
  );
};

export default SidebarMenu;
