// src/components/Footer.js
import React from 'react';
import styled from 'styled-components';

const Footer = () => {
  return (
    <FooterContainer id="contact">
      <p>Designed & Built by Carlos Keglevich</p>
    </FooterContainer>
  );
};

export default Footer;

const FooterContainer = styled.footer`
  padding: 2rem;
  background-color: #0a192f;
  color: #ccd6f6;
  text-align: center;
`;
