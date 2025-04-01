import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import gameTheoryImage from '../images/gt.png';

const ContactUs = ({ theme }) => {
  const { t } = useTranslation();
  return (
    <div className="contact-us" data-theme={theme}>
      <h2>{t('contact_us')}</h2>
      <p>{t('footer_contact')}: <a href="mailto:bshoemak@mac.com">bshoemak@mac.com</a></p>
      <img src={gameTheoryImage} alt="Game Theory" className="game-theory-image" />
      <div className="contact-buttons">
        <Link to="/" className="back-link">{t('back_to_home')}</Link>
        <Link to="/" className="home-button">{t('home')}</Link>
      </div>
    </div>
  );
};

export default ContactUs;