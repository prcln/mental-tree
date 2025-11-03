import { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext({});

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};

// Translation data
const translations = {
  en: {
    // Auth
    'auth.title': 'Mood Tree',
    'auth.subtitle': 'Grow your emotional wellness journey',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.confirmPassword': 'Confirm Password',
    'auth.signIn': 'Sign In',
    'auth.signUp': 'Sign Up',
    'auth.signOut': 'Sign Out',
    'auth.noAccount': "Don't have an account? Sign up",
    'auth.hasAccount': 'Already have an account? Sign in',
    'auth.loading': 'Loading...',
    'auth.minChars': 'Minimum 6 characters',
    
    // Tree Page
    'tree.welcome': 'Welcome',
    'tree.treesGrown': 'trees grown',
    'tree.encouragementsReceived': 'encouragements received',
    'tree.loadingTree': 'Loading your tree...',
    'tree.growthPoints': 'growth points',
    'tree.messages': 'messages',
    'tree.dailyCheckIn': 'Daily Check-in',
    'tree.shareTree': 'Share Tree',
    'tree.renewSeed': 'Renew Seed',
    'tree.sendEncouragement': 'Send Encouragement',
    
    // Tree Stages
    'stage.seed': 'Seed of Hope',
    'stage.sprout': 'New Beginning',
    'stage.sapling': 'Growing Strong',
    'stage.young': 'Reaching Higher',
    'stage.mature': 'Flourishing',
    'stage.blooming': 'Full Bloom',
    
    // Daily Check-in
    'checkin.title': 'How are you feeling today?',
    'checkin.great': 'Great!',
    'checkin.good': 'Good',
    'checkin.okay': 'Okay',
    'checkin.trying': 'Trying',
    'checkin.notePlaceholder': 'Anything you\'d like to note? (optional)',
    'checkin.cancel': 'Cancel',
    'checkin.save': 'Save Check-in 💧',
    'checkin.wait': 'Wait',
    
    // Encouragement
    'encourage.title': 'Send a message of support 💫',
    'encourage.placeholder': 'Write something encouraging...',
    'encourage.namePlaceholder': 'Your name (optional)',
    'encourage.chooseIcon': 'Choose an icon:',
    'encourage.butterfly': '🦋 Butterfly',
    'encourage.bird': '🐦 Bird',
    'encourage.flower': '🌸 Flower',
    'encourage.send': 'Send 💫',
    'encourage.warning': 'Please write an encouraging message! Include positive words like "hope", "believe", "strong", "proud", or "you can do it" 💪',
    
    // Share Tree
    'share.title': 'Share Your Tree',
    'share.visibility': 'Tree Visibility',
    'share.visibilityDesc': 'Allow others to view and send encouragement to your tree',
    'share.shareLink': 'Share Link',
    'share.copy': 'Copy',
    'share.copied': 'Copied!',
    'share.shareVia': 'Share via',
    'share.facebook': 'Facebook',
    'share.twitter': 'Twitter',
    'share.email': 'Email',
    'share.tip': 'Anyone with this link can view your tree and send encouragement messages',
    'share.private': 'Your tree is private',
    'share.privateDesc': 'Enable public visibility to share your tree with others and receive encouragement!',
    'share.close': 'Close',
    
    // Quiz
    'quiz.question': 'Question',
    'quiz.of': 'of',
    'quiz.previous': '← Previous',
    'quiz.result.title': 'You\'re a',
    'quiz.result.continue': 'Start Growing Your Tree! 🌱',
    
    // Retake Quiz Modal
    'retake.title': 'Renew Your Seed?',
    'retake.subtitle': 'Start Fresh with a New Tree',
    'retake.warning': '⚠️ Important: This action will:',
    'retake.reset': 'Reset your tree to seed stage',
    'retake.clearPoints': 'Clear all growth points (mood score)',
    'retake.removeMessages': 'Remove all encouragement messages',
    'retake.chooseNew': 'Let you choose a new tree personality',
    'retake.freshStart': 'This is a fresh start. Your journey begins anew! 🌟',
    'retake.confirm': 'Yes, Renew My Seed',
    'retake.cancel': 'Cancel',
    'retake.wait': '🕐 Please wait',
    
    // Shared Tree
    'shared.tree': 'Tree',
    'shared.myTree': 'My Tree',
    'shared.sendMessage': 'Send an encouraging message to help their tree grow!',
    'shared.yourTree': '✨ This is your tree! Share this link with friends to receive encouragement.',
    'shared.cannotSend': '⚠️ You cannot send messages to your own tree',
    'shared.loading': 'Loading tree...',
    'shared.oops': '😔 Oops!',
    'shared.goToTree': 'Go to Your Tree',
    
    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.retry': 'Retry',
    'common.save': 'Save',
    'common.close': 'Close',
  },
  
  vi: {
    // Auth
    'auth.title': 'Cây Tâm Trạng',
    'auth.subtitle': 'Phát triển hành trình chăm sóc cảm xúc',
    'auth.email': 'Email',
    'auth.password': 'Mật khẩu',
    'auth.confirmPassword': 'Xác nhận mật khẩu',
    'auth.signIn': 'Đăng nhập',
    'auth.signUp': 'Đăng ký',
    'auth.signOut': 'Đăng xuất',
    'auth.noAccount': 'Chưa có tài khoản? Đăng ký',
    'auth.hasAccount': 'Đã có tài khoản? Đăng nhập',
    'auth.loading': 'Đang tải...',
    'auth.minChars': 'Tối thiểu 6 ký tự',
    
    // Tree Page
    'tree.welcome': 'Chào mừng',
    'tree.treesGrown': 'cây đã trồng',
    'tree.encouragementsReceived': 'lời động viên nhận được',
    'tree.loadingTree': 'Đang tải cây của bạn...',
    'tree.growthPoints': 'điểm phát triển',
    'tree.messages': 'tin nhắn',
    'tree.dailyCheckIn': 'Ghi nhận hàng ngày',
    'tree.shareTree': 'Chia sẻ cây',
    'tree.renewSeed': 'Làm mới hạt giống',
    'tree.sendEncouragement': 'Gửi động viên',
    
    // Tree Stages
    'stage.seed': 'Hạt giống hy vọng',
    'stage.sprout': 'Khởi đầu mới',
    'stage.sapling': 'Lớn mạnh',
    'stage.young': 'Vươn cao',
    'stage.mature': 'Phát triển',
    'stage.blooming': 'Nở rộ',
    
    // Daily Check-in
    'checkin.title': 'Hôm nay bạn cảm thấy thế nào?',
    'checkin.great': 'Tuyệt vời!',
    'checkin.good': 'Tốt',
    'checkin.okay': 'Ổn',
    'checkin.trying': 'Cố gắng',
    'checkin.notePlaceholder': 'Có điều gì bạn muốn ghi chú không? (tùy chọn)',
    'checkin.cancel': 'Hủy',
    'checkin.save': 'Lưu ghi nhận 💧',
    'checkin.wait': 'Chờ',
    
    // Encouragement
    'encourage.title': 'Gửi lời động viên 💫',
    'encourage.placeholder': 'Viết điều gì đó động viên...',
    'encourage.namePlaceholder': 'Tên của bạn (tùy chọn)',
    'encourage.chooseIcon': 'Chọn biểu tượng:',
    'encourage.butterfly': '🦋 Bướm',
    'encourage.bird': '🐦 Chim',
    'encourage.flower': '🌸 Hoa',
    'encourage.send': 'Gửi 💫',
    'encourage.warning': 'Vui lòng viết lời động viên! Bao gồm những từ tích cực như "hy vọng", "tin tưởng", "mạnh mẽ", "tự hào", hoặc "bạn làm được" 💪',
    
    // Share Tree
    'share.title': 'Chia sẻ cây của bạn',
    'share.visibility': 'Hiển thị cây',
    'share.visibilityDesc': 'Cho phép người khác xem và gửi động viên đến cây của bạn',
    'share.shareLink': 'Liên kết chia sẻ',
    'share.copy': 'Sao chép',
    'share.copied': 'Đã sao chép!',
    'share.shareVia': 'Chia sẻ qua',
    'share.facebook': 'Facebook',
    'share.twitter': 'Twitter',
    'share.email': 'Email',
    'share.tip': 'Bất kỳ ai có liên kết này đều có thể xem cây và gửi tin nhắn động viên',
    'share.private': 'Cây của bạn đang ở chế độ riêng tư',
    'share.privateDesc': 'Bật chế độ công khai để chia sẻ cây với người khác và nhận động viên!',
    'share.close': 'Đóng',
    
    // Quiz
    'quiz.question': 'Câu hỏi',
    'quiz.of': 'trên',
    'quiz.previous': '← Trước',
    'quiz.result.title': 'Bạn là',
    'quiz.result.continue': 'Bắt đầu trồng cây! 🌱',
    
    // Retake Quiz Modal
    'retake.title': 'Làm mới hạt giống?',
    'retake.subtitle': 'Bắt đầu lại với cây mới',
    'retake.warning': '⚠️ Quan trọng: Hành động này sẽ:',
    'retake.reset': 'Đặt lại cây về giai đoạn hạt giống',
    'retake.clearPoints': 'Xóa tất cả điểm phát triển (điểm tâm trạng)',
    'retake.removeMessages': 'Xóa tất cả tin nhắn động viên',
    'retake.chooseNew': 'Cho phép bạn chọn tính cách cây mới',
    'retake.freshStart': 'Đây là khởi đầu mới. Hành trình của bạn bắt đầu lại! 🌟',
    'retake.confirm': 'Có, làm mới hạt giống',
    'retake.cancel': 'Hủy',
    'retake.wait': '🕐 Vui lòng đợi',
    
    // Shared Tree
    'shared.tree': 'Cây',
    'shared.myTree': 'Cây của tôi',
    'shared.sendMessage': 'Gửi lời động viên để giúp cây phát triển!',
    'shared.yourTree': '✨ Đây là cây của bạn! Chia sẻ liên kết này với bạn bè để nhận động viên.',
    'shared.cannotSend': '⚠️ Bạn không thể gửi tin nhắn cho cây của chính mình',
    'shared.loading': 'Đang tải cây...',
    'shared.oops': '😔 Ối!',
    'shared.goToTree': 'Đến cây của bạn',
    
    // Common
    'common.loading': 'Đang tải...',
    'common.error': 'Lỗi',
    'common.retry': 'Thử lại',
    'common.save': 'Lưu',
    'common.close': 'Đóng',
  }
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    // Check localStorage first
    const saved = localStorage.getItem('mood-tree-language');
    if (saved) return saved;
    
    // Check browser language
    const browserLang = navigator.language.split('-')[0];
    return browserLang === 'vi' ? 'vi' : 'en';
  });

  useEffect(() => {
    localStorage.setItem('mood-tree-language', language);
  }, [language]);

  const t = (key) => {
    return translations[language][key] || key;
  };

  const switchLanguage = (lang) => {
    if (translations[lang]) {
      setLanguage(lang);
    }
  };

  const value = {
    language,
    switchLanguage,
    t,
    availableLanguages: Object.keys(translations)
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};