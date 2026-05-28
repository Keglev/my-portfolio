import React from 'react';
import { useTranslation } from 'react-i18next';
import { Menu, StyledLink, LanguageWrapper, CVDownloadWrapper, CVDownloadLink } from './SidebarStyles';

const SidebarMenu = ({ activeSection, changeLanguage }) => {
  const { t, i18n } = useTranslation();

  const cvFile =
    i18n.language === 'de'
      ? '/Carlos_Keglevich_Lebenslauf_DE.pdf'
      : '/Carlos_Keglevich_CV_EN.pdf';

  const cvLabel =
    i18n.language === 'de' ? 'Lebenslauf herunterladen' : 'Download Resume';

  return (
    <>
      <Menu>
        <StyledLink
          to="About"
          smooth={true}
          duration={500}
          spy={true}
          activeClass={activeSection === 'About' ? 'active' : ''}
          containerId="scroll-container"
          offset={70}
        >
          {t('about')}
        </StyledLink>

        <StyledLink
          to="Education"
          smooth={true}
          duration={500}
          spy={true}
          activeClass={activeSection === 'Education' ? 'active' : ''}
          containerId="scroll-container"
          offset={70}
        >
          {t('education')}
        </StyledLink>

        <StyledLink
          to="Projects"
          smooth={true}
          duration={500}
          spy={true}
          activeClass={activeSection === 'Projects' ? 'active' : ''}
          containerId="scroll-container"
          offset={70}
        >
          {t('projects')}
        </StyledLink>

        <StyledLink
          to="RepoDocs"
          smooth={true}
          duration={500}
          spy={true}
          activeClass={activeSection === 'RepoDocs' ? 'active' : ''}
          containerId="scroll-container"
          offset={70}
        >
          {t('repoDocs')}
        </StyledLink>

        <StyledLink
          to="Experience"
          smooth={true}
          duration={500}
          spy={true}
          activeClass={activeSection === 'Experience' ? 'active' : ''}
          containerId="scroll-container"
          offset={70}
        >
          {t('experience.jobExperiences')}
        </StyledLink>
      </Menu>

      <LanguageWrapper role="group" aria-label="Language switch">
        <button onClick={() => changeLanguage('en')} aria-label="Switch to English">{t('language.english')}</button>
        <button onClick={() => changeLanguage('de')} aria-label="Switch to German">{t('language.german')}</button>
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
