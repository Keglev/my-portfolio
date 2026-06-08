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

const SECTIONS = ['Legal', 'RepoDocs', 'Experience', 'Projects', 'Education'];

const getActiveSection = (scrollPosition) => {
  for (const id of SECTIONS) {
    const el = document.getElementById(id);
    if (el && scrollPosition >= el.offsetTop) return id;
  }
  return 'About';
};

const Sidebar = () => {
  const { t } = useTranslation();
  const [activeSection, setActiveSection] = useState('About');

  useEffect(() => {
    const handleScroll = () => {
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
          <span style={{ color: '#8892b0' }}>|</span>
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
