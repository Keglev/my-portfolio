import React from 'react';
import { FaGithub, FaLinkedin, FaEnvelope } from 'react-icons/fa';
import { SiXing } from 'react-icons/si';
import { SocialLinksWrapper, SocialLinks } from './SidebarStyles';

const SidebarSocial = () => {
  return (
    <SocialLinksWrapper>
      <SocialLinks>
        <a href="https://github.com/keglev" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
          <FaGithub />
        </a>
        <a href="https://linkedin.com/in/carloskeglevich" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
          <FaLinkedin />
        </a>
        <a href="https://www.xing.com/profile/Carlos_Keglevich" target="_blank" rel="noopener noreferrer" aria-label="Xing">
          <SiXing />
        </a>
        <a href="mailto:carlos.keglevich@gmail.com" target="_blank" rel="noopener noreferrer" aria-label="Email">
          <FaEnvelope />
        </a>
      </SocialLinks>
    </SocialLinksWrapper>
  );
};

export default SidebarSocial;
