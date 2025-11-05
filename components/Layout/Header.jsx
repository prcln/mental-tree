import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext/LanguageContext';

import './Header.css';
import { userService } from '../../services/userService';
import { treeService } from '../../services/treeService';

// Motivational quotes pool
const motivationalQuotes = [
  { en: "Growth happens one step at a time 🌱", vi: "Sự phát triển diễn ra từng bước một 🌱" },
  { en: "Your emotions are valid and important 💚", vi: "Cảm xúc của bạn đều có giá trị 💚" },
  { en: "Every day is a new beginning 🌅", vi: "Mỗi ngày là một khởi đầu mới 🌅" },
  { en: "Small progress is still progress ✨", vi: "Tiến bộ nhỏ vẫn là tiến bộ ✨" },
  { en: "Be kind to yourself today 🌸", vi: "Hãy tử tế với bản thân hôm nay 🌸" },
  { en: "You're doing better than you think 🌟", vi: "Bạn đang làm tốt hơn bạn nghĩ 🌟" },
  { en: "Healing is not linear 🌈", vi: "Sự chữa lành không theo đường thẳng 🌈" },
  { en: "Your journey is uniquely yours 🦋", vi: "Hành trình của bạn là duy nhất 🦋" },
  { en: "Embrace your authentic self 💫", vi: "Hãy là chính mình 💫" },
  { en: "You deserve happiness and peace 🕊️", vi: "Bạn xứng đáng có hạnh phúc và bình yên 🕊️" },
  { en: "Progress over perfection 🎯", vi: "Tiến bộ quan trọng hơn hoàn hảo 🎯" },
  { en: "You are stronger than you know 💪", vi: "Bạn mạnh mẽ hơn bạn nghĩ 💪" },
  { en: "Take it one moment at a time ⏳", vi: "Từng khoảnh khắc một thôi ⏳" },
  { en: "Your feelings matter 💝", vi: "Cảm xúc của bạn rất quan trọng 💝" },
  { en: "Bloom at your own pace 🌺", vi: "Hãy nở hoa theo nhịp của riêng bạn 🌺" }
];

function Header() {
  const { user, signOut } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [currentTreeId, setCurrentTreeId] = useState('');
  const [userProfile, setUserProfile] = useState(null);
  const [viewingProfile, setViewingProfile] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentQuote, setCurrentQuote] = useState(motivationalQuotes[0]);
  
  // Determine context - Extract just the UUID from paths like /tree/uuid or /tree/shared/uuid
  const isViewingOtherTree = location.pathname.match(/^\/tree\/(.+)$/);
  let viewedUserId = null;
  
  if (isViewingOtherTree) {
    const fullPath = isViewingOtherTree[1];
    viewedUserId = fullPath.includes('/') ? fullPath.split('/').pop() : fullPath;
  }

  // Rotate quotes every 10 seconds
  useEffect(() => {
    const getRandomQuote = () => {
      const randomIndex = Math.floor(Math.random() * motivationalQuotes.length);
      setCurrentQuote(motivationalQuotes[randomIndex]);
    };

    // Set initial random quote
    getRandomQuote();

    // Rotate every 100 seconds
    const interval = setInterval(getRandomQuote, 100000);

    return () => clearInterval(interval);
  }, []);

  // Load user profile when logged in
  useEffect(() => {
    if (user) {
      loadUserProfile();
    }
  }, [user]);

  // Load viewed user's profile when viewing someone else's tree
  useEffect(() => {
    if (viewedUserId && viewedUserId !== user?.id) {
      loadViewedProfile(viewedUserId);
    } else {
      setViewingProfile(null);
    }
  }, [viewedUserId, user]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMenuOpen && !event.target.closest('.header-actions')) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isMenuOpen]);

  const loadUserProfile = async () => {
    try {
      const profile = await userService.getUserProfile(user.id);
      setUserProfile(profile);
      
      const trees = await treeService.getUserTrees(user.id);
      
      if (trees && trees.length > 0) {
        const tree = trees[0];
        setCurrentTreeId(tree.id);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const loadViewedProfile = async (userId) => {
    try {
      const profile = await userService.getUserProfile(userId);
      setViewingProfile(profile);
    } catch (error) {
      console.error('Error loading viewed profile:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
      setIsMenuOpen(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleReport = () => {
    navigate(`/report/${currentTreeId}`);
    setIsMenuOpen(false);
  };

  const handleHome = () => {
    navigate('/tree');
    setIsMenuOpen(false);
  };

  const handleGarden = () => {
    navigate('/garden');
    setIsMenuOpen(false);
  };

  const handleSignIn = () => {
    navigate('/login');
    setIsMenuOpen(false);
  };

  const handleSignUp = () => {
    navigate('/signup');
    setIsMenuOpen(false);
  };

  const toggleMenu = (e) => {
    e.stopPropagation();
    setIsMenuOpen(!isMenuOpen);
  };

  // Get current quote based on language
  const displayQuote = language === 'vi' ? currentQuote.vi : currentQuote.en;

  // Guest viewing someone else's tree (not logged in)
  if (!user && isViewingOtherTree) {
    return (
      <div className="tree-page-header">
        <div className="header-user-info">
          <span>{t('header.viewing')} {viewingProfile?.display_name || 'User'}{t('header.tree')} 🌳</span>
          <span className="motivational-quote">{displayQuote}</span>
        </div>
        <div className="header-actions">
          <button className="hamburger-menu" onClick={toggleMenu}>
            ☰
          </button>
          <div className={`desktop-buttons ${isMenuOpen ? 'show-mobile' : ''}`}>
            <button className="report-btn" onClick={handleSignIn}>
              {t('header.signIn')}
            </button>
            <button className="sign-out-btn" onClick={handleSignUp}>
              {t('header.signUp')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // User not logged in (on other public pages)
  if (!user) {
    return (
      <div className="tree-page-header">
        <div className="header-user-info">
          <span>{t('header.welcomeGuest')} 🌳</span>
          <span className="motivational-quote">{displayQuote}</span>
        </div>
        <div className="header-actions">
          <button className="hamburger-menu" onClick={toggleMenu}>
            ☰
          </button>
          <div className={`desktop-buttons ${isMenuOpen ? 'show-mobile' : ''}`}>
            <button className="report-btn" onClick={handleSignIn}>
              {t('header.signIn')}
            </button>
            <button className="sign-out-btn" onClick={handleSignUp}>
              {t('header.getStarted')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Logged in user viewing someone else's tree
  if (user && isViewingOtherTree && viewedUserId !== user.id) {
    return (
      <div className="tree-page-header">
        <div className="header-user-info">
          <span>{t('header.viewing')} {viewingProfile?.display_name || 'User'}{t('header.tree')} 🌳</span>
          <span className="motivational-quote">{displayQuote}</span>
        </div>
        <div className="header-actions">
          <button className="hamburger-menu" onClick={toggleMenu}>
            ☰
          </button>
          <div className={`desktop-buttons ${isMenuOpen ? 'show-mobile' : ''}`}>
            <button className="my-tree-btn" onClick={handleHome}>
              {t('header.myTree')}
            </button>
            <button className="sign-out-btn" onClick={handleSignOut}>
              {t('header.signOut')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Logged in user on their own tree (default)
  return (
    <div className="tree-page-header">
      <div className="header-user-info">
        <span>{t('header.welcome')}, {userProfile?.display_name || 'User'}!</span>
        <span className="motivational-quote">{displayQuote}</span>
      </div>
      <div className="header-actions">
        <button className="hamburger-menu" onClick={toggleMenu}>
          ☰
        </button>
        <div className={`desktop-buttons ${isMenuOpen ? 'show-mobile' : ''}`}>
          <button className="report-btn" onClick={handleGarden}>
            {t('header.garden')}
          </button>
          <button className="my-tree-btn" onClick={handleHome}>
            {t('header.myTree')}
          </button>
          <button className="report-btn" onClick={handleReport}>
            {t('header.emotionReport')}
          </button>
          <button className="sign-out-btn" onClick={handleSignOut}>
            {t('header.signOut')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Header;