import React from 'react';
import LanguageSwitcher from '../LanguageComponent/LanguageSwitcher';
import './Footer.css'

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="footer-content">
        <p>&copy; {currentYear} Emotion Tree Project.</p>
        <div className="footer-links">
          <a href="/about">About</a>
          <a href="/terms">Terms of Service</a>
          <a href="/privacy">Privacy Policy</a>
        </div>
        <div>
          <LanguageSwitcher />
        </div>
      </div>
    </footer>
  );
}

export default Footer;