/**
 * @file Contact.js
 * @module components/Contact/Contact
 * @summary Contact section with a Web3Forms-backed form and social links.
 * @enterprise Web3Forms is static-site friendly (no own backend needed);
 * the public access key comes from the VITE_WEB3FORMS_KEY environment
 * variable, injected at build time by the deploy workflow. Includes a
 * required DSGVO
 * consent checkbox (submit stays disabled until checked) and a hidden
 * honeypot field ("botcheck") that Web3Forms uses for spam filtering. The
 * social links (GitHub/LinkedIn/Xing/email) are a direct-contact fallback
 * for visitors who skip the form entirely.
 */
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaGithub, FaLinkedin, FaEnvelope } from 'react-icons/fa';
import { SiXing } from 'react-icons/si';
import './Contact.css';

/**
 * @returns {JSX.Element}
 */
const Contact = () => {
  const { t } = useTranslation();
  const [status, setStatus] = useState('idle'); // idle | sending | success | error
  const [consent, setConsent] = useState(false);

  const accessKey = import.meta.env.VITE_WEB3FORMS_KEY || '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!consent || status === 'sending') return;
    setStatus('sending');

    // FormData instead of named-property access: form.name on a <form> returns
    // the form's own name attribute, not the input, so form.name.value crashes.
    const form = e.target;
    const fd = new FormData(form);
    const senderName = fd.get('name') || '';
    const payload = {
      access_key: accessKey,
      name: senderName,
      email: fd.get('email') || '',
      message: fd.get('message') || '',
      botcheck: fd.get('botcheck') || '',
      subject: 'Portfolio contact from ' + senderName,
    };

    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setStatus('success');
        form.reset();
        setConsent(false);
      } else {
        setStatus('error');
      }
    } catch (err) {
      setStatus('error');
    }
  };

  // Name/email/message are uncontrolled and reset natively via the button's own
  // type="reset" default action; consent and the status message are React state,
  // so they're cleared here. Wired to onClick (not the form's onReset) because
  // handleSubmit also calls form.reset() imperatively on success, and that must
  // not clear the just-set success status.
  const handleClear = () => {
    setConsent(false);
    setStatus('idle');
  };

  return (
    <section className="contact-container" id="ContactSection" aria-label="Contact">
      <h2>{t('contactSection.heading')}</h2>
      <p className="contact-lead">{t('contactSection.lead')}</p>

      <form className="contact-form" onSubmit={handleSubmit} noValidate={false}>
        {/* Honeypot: hidden from users, bots fill it and get filtered by Web3Forms */}
        <input type="checkbox" name="botcheck" tabIndex="-1" className="contact-botcheck" aria-hidden="true" />

        <div className="contact-row">
          <div className="contact-field">
            <label htmlFor="contact-name">{t('contactSection.name')}</label>
            <input id="contact-name" name="name" type="text" required autoComplete="name" />
          </div>
          <div className="contact-field">
            <label htmlFor="contact-email">{t('contactSection.email')}</label>
            <input id="contact-email" name="email" type="email" required autoComplete="email" />
          </div>
        </div>

        <div className="contact-field">
          <label htmlFor="contact-message">{t('contactSection.message')}</label>
          <textarea id="contact-message" name="message" rows="5" required />
        </div>

        <label className="contact-consent">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            aria-label={t('contactSection.consent')}
          />
          <span>{t('contactSection.consent')}</span>
        </label>

        <div className="contact-actions">
          <button type="reset" className="contact-clear" onClick={handleClear}>{t('contactSection.clear')}</button>
          <button type="submit" className="contact-submit" disabled={!consent || status === 'sending'}>
            {status === 'sending' ? t('contactSection.sending') : t('contactSection.send')}
          </button>
        </div>

        {status === 'success' && (
          <p className="contact-status success" role="status">{t('contactSection.success')}</p>
        )}
        {status === 'error' && (
          <p className="contact-status error" role="alert">{t('contactSection.error')}</p>
        )}
      </form>

      {/* Direct channels for people who skip the form entirely */}
      <div className="contact-socials">
        <a href="https://github.com/keglev" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
          <FaGithub />
        </a>
        <a href="https://linkedin.com/in/carloskeglevich" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
          <FaLinkedin />
        </a>
        <a href="https://www.xing.com/profile/Carlos_Keglevich" target="_blank" rel="noopener noreferrer" aria-label="Xing">
          <SiXing />
        </a>
        <a href="mailto:carlos.keglevich@gmail.com" aria-label="Email">
          <FaEnvelope />
        </a>
      </div>
    </section>
  );
};

export default Contact;
