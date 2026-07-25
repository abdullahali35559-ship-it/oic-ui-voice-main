// src/components/layout/Sidebar.jsx
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';

export const Sidebar = ({ activePage, setActivePage, onCollapseChange }) => {
    const { t, language } = useLanguage();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 1024;
            setIsMobile(mobile);
            if (!mobile) setIsMobileOpen(false);
            
            // Auto-collapse on smaller screens
            if (window.innerWidth < 1280 && !mobile) {
                setIsCollapsed(true);
                if (onCollapseChange) onCollapseChange(true);
            } else if (window.innerWidth >= 1280) {
                setIsCollapsed(false);
                if (onCollapseChange) onCollapseChange(false);
            }
        };
        window.addEventListener('resize', handleResize);
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const navItems = [
        { id: "dashboard",  label: t.nav.dashboard,      icon: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" },
        { id: "documents",  label: t.nav.documents,      icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
        { id: "ask",        label: t.nav.askCompliance,  icon: "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" },
        { id: "aiwriter",   label: t.nav.aiWriter,       icon: "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z", hasSparkle: true },
        { id: "auditor",    label: t.nav.auditor,        icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
        { id: "templates",  label: t.nav.templates,      icon: "M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" },
        { id: "kb",         label: t.nav.knowledgeBase,  icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" },
        { id: "monitoring", label: t.nav.monitoring,     icon: "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" },
        { id: "analytics",  label: t.nav.analytics,      icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
        { id: "members",    label: "Members",             icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" },
        { id: "settings",   label: t.nav.settings,       icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" },
    ];

    const handleNavClick = (id) => {
        setActivePage(id);
        if (isMobile) setIsMobileOpen(false);
    };

    const toggleSidebar = () => {
        if (isMobile) {
            setIsMobileOpen(!isMobileOpen);
        } else {
            const newState = !isCollapsed;
            setIsCollapsed(newState);
            if (onCollapseChange) {
                onCollapseChange(newState);
            }
        }
    };

    const sidebarWidth = isCollapsed ? 'w-20' : 'w-64';

    return (
        <>
            {/* Mobile overlay */}
            {isMobile && isMobileOpen && (
                <div 
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* Mobile toggle button */}
            <button
                onClick={toggleSidebar}
                className={`lg:hidden fixed top-4 ${language === 'ar' ? 'right-4' : 'left-4'} z-50 bg-[#1a4731] text-white p-3 rounded-xl shadow-lg hover:bg-[#153d28] transition-all duration-200 hover:scale-105`}
                aria-label="Toggle Sidebar"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {isMobileOpen ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    )}
                </svg>
            </button>

            {/* Sidebar */}
            <aside 
                className={`
                    fixed top-0 ${language === 'ar' ? 'right-0' : 'left-0'} h-full z-40
                    ${isMobile ? 'transition-transform duration-300 ease-in-out' : 'transition-all duration-300 ease-in-out'}
                    ${isMobile ? (isMobileOpen ? 'translate-x-0' : (language === 'ar' ? 'translate-x-full' : '-translate-x-full')) : ''}
                    ${!isMobile ? sidebarWidth : 'w-64'}
                    glass-sidebar flex flex-col h-screen overflow-hidden
                `}
                style={{ direction: language === 'ar' ? 'rtl' : 'ltr' }}
            >
                {/* Logo & toggle */}
                <div className={`flex items-center ${isCollapsed && !isMobile ? 'justify-center' : 'justify-between'} p-4 border-b border-white/20 flex-shrink-0`}>
                    {!isCollapsed && !isMobile && (
                        <div className="flex items-center gap-3 min-w-0">
                            <img src="/3939.png" alt="OIC Logo" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                            <div className="truncate">
                                <div className="font-semibold text-gray-900 text-sm">OIC</div>
                                <div className="text-xs text-gray-700 truncate">{t.compliancePortal}</div>
                            </div>
                        </div>
                    )}
                    {isCollapsed && !isMobile && (
                        <img src="/3939.png" alt="OIC Logo" className="w-10 h-10 rounded-lg object-cover" />
                    )}
                    {!isMobile && (
                        <button 
                            onClick={toggleSidebar}
                            className="p-1.5 hover:bg-white/30 rounded-lg transition-colors text-gray-700 flex-shrink-0"
                            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                        >
                            {isCollapsed ? (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                                </svg>
                            ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7M19 19l-7-7 7-7" />
                                </svg>
                            )}
                        </button>
                    )}
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => handleNavClick(item.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                                ${activePage === item.id
                                    ? "bg-[#1a4731] text-white shadow-md"
                                    : "text-gray-700 hover:bg-white/30"
                                }
                                ${isCollapsed && !isMobile ? 'justify-center px-2' : ''}
                                group relative
                            `}
                            title={isCollapsed && !isMobile ? item.label : ''}
                        >
                            <svg className={`w-5 h-5 flex-shrink-0 ${activePage === item.id ? 'text-white' : 'text-gray-700 group-hover:text-gray-700'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                            </svg>
                            {(!isCollapsed || isMobile) && (
                                <>
                                    <span className="truncate">{item.label}</span>
                                    {item.hasSparkle && (
                                        <svg className="w-4 h-4 ml-auto rtl:mr-auto rtl:ml-0 flex-shrink-0 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                                        </svg>
                                    )}
                                </>
                            )}
                            {isCollapsed && !isMobile && (
                                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                                    {item.label}
                                </div>
                            )}
                        </button>
                    ))}
                </nav>
                <div className="h-4 flex-shrink-0"></div>
            </aside>
        </>
    );
};