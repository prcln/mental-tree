import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext/useAuth";
import { useLanguage } from "../../contexts/LanguageContext/LanguageContext";

const AuthForm = () => {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const { t, language, setLanguage } = useLanguage();

  const handleSubmit = async () => {
    // Validation
    if (!email || !password) {
      setError(t('auth.error.unfilled'));
      return;
    }

    if (!isLogin && !confirmPassword) {
      setError(t('auth.error.confirmPassword'));
      return;
    }

    if (password.length < 6) {
      setError(t('auth.error.minChars'));
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      setError(t('auth.error.notMatched'));
      return;
    }

    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      if (isLogin) {
        // Sign in using context
        await signIn(email, password);
        // Navigate to home after successful login
        navigate('/');
      } else {
        // Sign up using context
        const data = await signUp(email, password);
        
        // Check if email confirmation is required
        if (data?.user?.identities?.length === 0) {
          setError(t('auth.error.alreadyReg'));
        } else {
          setSuccessMessage(t('auth.success.accCreate'));
          // Switch to login mode
          setTimeout(() => {
            setIsLogin(true);
            setSuccessMessage('');
            setConfirmPassword('');
          }, 2000);
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError(err.message || t('auth.error.authFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setSuccessMessage('');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 via-pink-50 to-green-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🌳</div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">{t('auth.title')}</h1>
          <p className="text-gray-600">{t('auth.subtitle')}</p>
        </div>

        <div className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg text-sm bg-red-100 text-red-700 border border-red-200">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-lg text-sm bg-green-100 text-green-700 border border-green-200">
              {successMessage}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('auth.email')}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-400 focus:outline-none transition-colors"
              placeholder="your@email.com"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('auth.password')}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-400 focus:outline-none transition-colors"
              placeholder="••••••••"
              disabled={loading}
            />
            {!isLogin && (
              <p className="text-xs text-gray-500 mt-1">
                {t('auth.minChars')}
              </p>
            )}
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('auth.confirmPassword')}
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-400 focus:outline-none transition-colors"
                placeholder="••••••••"
                disabled={loading}
              />
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-xl font-bold hover:from-green-600 hover:to-green-700 transition-all duration-200 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t('auth.loading')}
              </span>
            ) : (
              isLogin ? t('auth.signIn') : t('auth.signUp')
            )}
          </button>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={switchMode}
            disabled={loading}
            className="text-green-600 hover:text-green-700 font-medium disabled:opacity-50"
          >
            {isLogin 
              ? t('auth.noAccount')
              : t('auth.hasAccount')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;