import React from 'react';
import LanguageSwitcher from '../LanguageComponent/LanguageSwitcher';
import './Footer.css'
import { useLanguage } from '../../contexts/LanguageContext/LanguageContext';

function Footer() {
  const currentYear = new Date().getFullYear();
  const { t } = useLanguage();

  return (
    <footer className="site-footer">
      <div className="footer-content">
        <p>&copy; {`${currentYear} ${t('footer.project')}`}</p>
        <div className="footer-links">
          <a href="/about">{t('footer.about')}</a>
          <a href="/terms">{t('footer.tos')}</a>
          <a href="/privacy">{t('footer.privacy')}</a>
        </div>
        <div>
          <LanguageSwitcher />
        </div>
      </div>
    </footer>
  );
}

export default Footer;