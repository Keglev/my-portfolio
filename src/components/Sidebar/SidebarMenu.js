import React from 'react';
import { useTranslation } from 'react-i18next';
import { Menu, StyledLink, LanguageWrapper, CVDownloadWrapper, CVDownloadLink } from './SidebarStyles';

const NAV_ITEMS = [
  { id: 'About',      key: 'about' },
  { id: 'Education',  key: 'education' },
  { id: 'Projects',   key: 'projects' },
  { id: 'RepoDocs',   key: 'repoDocs' },
  { id: 'Experience', key: 'experience.jobExperiences' },
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
        <button onClick={() => i18n.changeLanguage('en')} aria-label="Switch to English">{t('language.english')}</button>
        <button onClick={() => i18n.changeLanguage('de')} aria-label="Switch to German">{t('language.german')}</button>
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
