// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Preloader } from '../components/common/Preloader';

export const LoginPage = ({ onLogin }) => {
  const { language } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPreloader, setShowPreloader] = useState(true);

  const handlePreloaderComplete = () => {
    setShowPreloader(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    setTimeout(() => {
      if (!email || !password) {
        setError(language === 'ar' ? 'يرجى ملء جميع الحقول' : 'Please fill in all fields');
      } else if (email === 'admin@oic.org' && password === 'Admin@123') {
        onLogin({ email, name: 'Admin User' });
      } else {
        setError(language === 'ar' ? 'بيانات الاعتماد غير صالحة' : 'Invalid Credentials. Please try again.');
      }
      setLoading(false);
    }, 1000);
  };

  if (showPreloader) {
    return <Preloader onComplete={handlePreloaderComplete} videoSrc="/videos/oic-intro.mp4" />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{
      background: 'linear-gradient(135deg, rgba(26,71,49,0.95), rgba(10,61,42,0.98))'
    }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/3939.png" alt="OIC Logo" className="w-20 h-20 rounded-2xl mx-auto mb-4 shadow-xl" />
          <h1 className="text-3xl font-bold text-white">OIC</h1>
          <p className="text-white/60 mt-2">Compliance Portal</p>
        </div>

        {/* Login Card */}
        <div className="glass-card p-8" style={{ background: 'rgba(255,255,255,0.15)' }}>
          <h2 className="text-2xl font-semibold text-white mb-6 text-center">
            {language === 'ar' ? 'تسجيل الدخول' : 'Sign In'}
          </h2>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-white p-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                {language === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all"
                placeholder="Enter your email address"
                required
              />
            </div>

            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                {language === 'ar' ? 'كلمة المرور' : 'Password'}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#c9a84c] text-[#1a4731] font-semibold rounded-lg hover:bg-yellow-400 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
                </span>
              ) : (
                language === 'ar' ? 'تسجيل الدخول' : 'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-between text-white/60 text-sm px-1">
            <button type="button" className="hover:text-white transition-colors cursor-pointer">
              Forgot Password?
            </button>
            <button type="button" className="hover:text-white transition-colors cursor-pointer">
              Need Help?
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};