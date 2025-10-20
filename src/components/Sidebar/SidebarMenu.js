import React from 'react';
import { useTranslation } from 'react-i18next';
import { Menu, StyledLink, LanguageWrapper } from './SidebarStyles';

const SidebarMenu = ({ activeSection, changeLanguage }) => {
  const { t } = useTranslation();

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
          {t('experience')}
        </StyledLink>
      </Menu>

      <LanguageWrapper role="group" aria-label="Language switch">
        <button onClick={() => changeLanguage('en')} aria-label="Switch to English">{t('language.english')}</button>
        <button onClick={() => changeLanguage('de')} aria-label="Switch to German">{t('language.german')}</button>
      </LanguageWrapper>
    </>
  );
};

export default SidebarMenu;
