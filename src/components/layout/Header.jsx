// src/components/layout/Header.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';

const languages = [
  { code: 'en', label: 'EN', flag: '🇬🇧' },
  { code: 'ar', label: 'AR', flag: '🇸🇦' },
  { code: 'es', label: 'ES', flag: '🇪🇸' },
  { code: 'fr', label: 'FR', flag: '🇫🇷' },
];

export const Header = ({ title, onSearch, isSidebarCollapsed, setActivePage, onLogout }) => {
  const { language, setLanguage, t } = useLanguage();
  const [langOpen, setLangOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  // Notification States
  const [notifOpen, setNotifOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [notifications, setNotifications] = useState([
    { id: 1, text: "Saudi Portal: OIC Article 5 updated", read: false, time: "2h ago" },
    { id: 2, text: "New document generated: Code of Ethics v2", read: false, time: "5h ago" },
    { id: 3, text: "Audit complete: Cancellation Policy reviewed", read: true, time: "1d ago" }
  ]);

  // User Dropdown State
  const [userOpen, setUserOpen] = useState(false);
  
  const current = languages.find(l => l.code === language);
  const langRef = useRef(null);
  const notifRef = useRef(null);
  const userRef = useRef(null);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (langRef.current && !langRef.current.contains(event.target)) {
        setLangOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifOpen(false);
      }
      if (userRef.current && !userRef.current.contains(event.target)) {
        setUserOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setToastMessage("All notifications marked as read.");
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleViewAll = () => {
    setNotifOpen(false);
    setToastMessage("Opening notifications board...");
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleNotificationClick = (n) => {
    setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, read: true } : item));
    setToastMessage(`Notification: "${n.text}"`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) setIsSearchOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains('dark');
    setIsDark(isDarkMode);
  }, []);

  const toggleDarkMode = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (onSearch && searchTerm.trim()) {
      onSearch(searchTerm);
      if (isMobile) setIsSearchOpen(false);
    }
  };

  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
    if (!isSearchOpen) {
      setTimeout(() => {
        document.getElementById('mobile-search-input')?.focus();
      }, 100);
    }
  };

  // Calculate header padding based on sidebar state
  const getHeaderPadding = () => {
    if (isMobile) return 'px-3 sm:px-4';
    if (isSidebarCollapsed) return 'px-4 md:px-6';
    return 'px-4 md:px-6';
  };

  return (
    <>
      <header className="glass-header flex-shrink-0 relative z-20">
        <div className={`flex items-center justify-between ${getHeaderPadding()} py-2.5 md:py-3 h-14 md:h-16`}>
          {/* Left: Title */}
          <h1 className={`text-base sm:text-lg md:text-xl font-semibold text-gray-900 truncate transition-opacity duration-200 ${isMobile && isSearchOpen ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>
            {title}
          </h1>

          {/* Right Section */}
          <div className={`flex items-center gap-1 sm:gap-2 md:gap-4 ${isMobile && isSearchOpen ? 'flex-1' : ''}`}>
            {/* Search - Desktop */}
            <form onSubmit={handleSearch} className={`${isMobile ? 'hidden' : 'relative'} flex-1 max-w-xs lg:max-w-sm`}>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                id="header-search"
                name="search"
                aria-label="search"
                placeholder={t.searchPlaceholder}
                className="w-full ps-9 pe-4 py-1.5 md:py-2 glass-input rounded-lg text-sm focus:outline-none"
              />
              <svg className="w-4 h-4 text-gray-700 absolute start-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </form>

            {/* Search - Mobile Toggle */}
            {isMobile && (
              <>
                {!isSearchOpen ? (
                  <button
                    onClick={toggleSearch}
                    className="p-2 rounded-lg hover:bg-white/30 transition-colors text-gray-605"
                    aria-label="Search"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                ) : (
                  <form onSubmit={handleSearch} className="flex-1 flex items-center gap-2 animate-slideIn">
                    <div className="relative flex-1">
                      <input
                        id="mobile-search-input"
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        name="search"
                        aria-label="search"
                        placeholder={t.searchPlaceholder}
                        className="w-full ps-9 pe-4 py-2 glass-input rounded-lg text-sm focus:outline-none"
                        autoFocus
                      />
                      <svg className="w-4 h-4 text-gray-700 absolute start-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <button
                      type="button"
                      onClick={toggleSearch}
                      className="p-2 text-gray-700 hover:text-gray-700"
                    >
                      ✕
                    </button>
                  </form>
                )}
              </>
            )}

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg hover:bg-white/30 transition-colors text-gray-655 text-base sm:text-lg"
              aria-label="Toggle Dark Mode"
              title="Toggle Dark Mode"
            >
              {isDark ? '☀️' : '🌙'}
            </button>

            {/* Language Switcher */}
            <div className="relative" ref={langRef}>
              <button
                onClick={() => setLangOpen(prev => !prev)}
                className="flex items-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2 glass-input rounded-lg text-xs sm:text-sm font-medium text-gray-700 hover:bg-white/70 transition-colors"
              >
                <span className="text-base sm:text-lg">{current.flag}</span>
                <span className="hidden xs:inline">{current.label}</span>
                <svg className={`w-3 h-3 sm:w-3.5 sm:h-3.5 transition-transform ${langOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {langOpen && (
                <div className={`absolute ${language === 'ar' ? 'left-0' : 'right-0'} top-full mt-1 w-32 sm:w-36 glass-card rounded-xl overflow-hidden shadow-xl z-50 border border-white/40`}>
                  {languages.map(lang => (
                    <button
                      key={lang.code}
                      onClick={() => { setLanguage(lang.code); setLangOpen(false); }}
                      className={`w-full flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm transition-colors
                        ${language === lang.code
                          ? 'bg-[#1a4731] text-white font-semibold'
                          : 'text-gray-700 hover:bg-white/40'
                        }`}
                    >
                      <span className="text-base">{lang.flag}</span>
                      <span>{lang.label}</span>
                      {language === lang.code && (
                        <svg className="w-3.5 h-3.5 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notification Dropdown */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen(prev => !prev)}
                id="notification-button"
                name="notification"
                aria-label="Notification"
                className="p-2 rounded-lg hover:bg-white/30 transition-colors text-gray-655 relative"
              >
                <span className="text-base sm:text-lg">🔔</span>
                {notifications.some(n => !n.read) && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                )}
              </button>

              {notifOpen && (
                <div className={`absolute ${language === 'ar' ? 'left-0' : 'right-0'} top-full mt-1.5 w-72 sm:w-80 bg-white rounded-xl shadow-2xl z-50 border border-gray-150 p-4 animate-slideUp text-left`}>
                  <div className="flex justify-between items-center pb-2 border-b border-gray-100 mb-2">
                    <span className="font-semibold text-gray-900 text-sm">Notifications</span>
                    <button 
                      onClick={handleMarkAllRead}
                      id="mark-all-read-button"
                      name="mark-all-read"
                      aria-label="Mark all read"
                      className="text-xs text-[#1a4731] hover:underline font-medium"
                    >
                      Mark all read
                    </button>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="text-center text-xs text-gray-700 py-4">No notifications yet.</p>
                    ) : (
                      notifications.map(n => (
                        <div 
                          key={n.id} 
                          onClick={() => handleNotificationClick(n)}
                          className={`p-2.5 rounded-lg text-xs cursor-pointer transition-colors ${n.read ? 'hover:bg-gray-50 text-gray-600' : 'bg-emerald-500/5 hover:bg-emerald-500/10 text-gray-900 font-medium'}`}
                        >
                          <div className="flex justify-between items-start gap-1">
                            <span>{n.text}</span>
                            {!n.read && <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full shrink-0 mt-1"></span>}
                          </div>
                          <span className="text-[10px] text-gray-700 block mt-1">{n.time}</span>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="pt-2 border-t border-gray-100 mt-2 flex justify-center">
                    <button 
                      onClick={handleViewAll}
                      id="view-all-notifications-button"
                      name="view-all"
                      aria-label="View all"
                      className="text-xs text-gray-700 hover:text-gray-950 hover:underline font-semibold"
                    >
                      View all
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User Dropdown */}
            <div className="relative" ref={userRef}>
              <button
                onClick={() => setUserOpen(prev => !prev)}
                id="user-dropdown-button"
                name="user"
                aria-label="User"
                className="flex items-center gap-2 p-1 rounded-full hover:bg-white/30 transition-colors"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#1a4731] text-white flex items-center justify-center text-xs sm:text-sm font-medium flex-shrink-0">
                  A
                </div>
              </button>

              {userOpen && (
                <div className={`absolute ${language === 'ar' ? 'left-0' : 'right-0'} top-full mt-1.5 w-48 bg-white rounded-xl shadow-2xl z-50 border border-gray-150 p-2.5 animate-slideUp text-left`}>
                  <div className="px-3 py-2 border-b border-gray-100 mb-1">
                    <p className="text-xs font-semibold text-gray-900">admin@oic.org</p>
                    <p className="text-[10px] text-gray-700 font-medium mt-0.5">OIC Administrator</p>
                  </div>
                  <button 
                    onClick={() => {
                      if (setActivePage) setActivePage("settings");
                      setUserOpen(false);
                    }}
                    id="user-settings-button"
                    name="settings"
                    aria-label="Settings"
                    className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-lg flex items-center gap-2 font-medium"
                  >
                    ⚙️ Settings
                  </button>
                  <button 
                    onClick={() => {
                      if (onLogout) onLogout();
                      setUserOpen(false);
                    }}
                    id="user-logout-button"
                    name="logout"
                    aria-label="Logout"
                    className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2 font-medium"
                  >
                    🚪 Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-[#1a4731] text-white px-4 py-3 rounded-xl shadow-2xl border border-white/20 text-sm font-medium animate-slideIn">
          {toastMessage}
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-slideIn {
          animation: slideIn 0.2s ease-out forwards;
        }
        
        @media (max-width: 480px) {
          .xs\\:inline {
            display: none;
          }
        }
        @media (min-width: 481px) {
          .xs\\:inline {
            display: inline;
          }
        }
        
        /* Header full width fix */
        .glass-header {
          width: 100% !important;
        }
      `}</style>
    </>
  );
};