import React from 'react';
import { useTranslation } from 'react-i18next';
import { Menu, StyledLink, LanguageWrapper, CVDownloadWrapper, CVDownloadLink } from './SidebarStyles';
import { useTheme } from '../../context/ThemeContext';

const NAV_ITEMS = [
  { id: 'About',    key: 'about' },
  { id: 'Skills',   key: 'skills' },
  { id: 'Projects', key: 'projects' },
  { id: 'Contact',  key: 'contact' },
];

/**
 * Renders the sidebar navigation links, language switcher, and CV download button.
 * The CV filename and label are both locale-driven to serve the correct language version.
 *
 * @param {string} activeSection - Id of the section currently in view
 * @returns {JSX.Element}
 */
const SidebarMenu = ({ activeSection }) => {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();

  const cvFile = i18n.language === 'de'
    ? '/Carlos_Keglevich_Lebenslauf_DE.pdf'
    : '/Carlos_Keglevich_CV_EN.pdf';
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
            // Offset keeps the section heading clear of the mobile top bar
            offset={70}
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
