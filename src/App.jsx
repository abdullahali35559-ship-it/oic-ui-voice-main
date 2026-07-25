// src/App.jsx
import React, { useState, useEffect } from 'react';
import { LanguageProvider } from './context/LanguageContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { LoginPage } from './pages/LoginPage';
import { Preloader } from './components/common/Preloader';
import { DashboardPage } from './pages/DashboardPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { AskCompliancePage } from './pages/AskCompliancePage';
import { AIWriterPage } from './pages/AIWriterPage';
import { AuditorPage } from './pages/AuditorPage';
import { TemplatesPage } from './pages/TemplatesPage';
import { KnowledgeBasePage } from './pages/KnowledgeBasePage';
import { MonitoringPage } from './pages/MonitoringPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { MembersPage } from './pages/MembersPage';
import { SettingsPage } from './pages/SettingsPage';
import { VoiceAssistant } from './components/common/VoiceAssistant';
import { useLanguage } from './context/LanguageContext';
import { mockData as initialMockData } from './data/mockData';

const AppInner = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [activePage, setActivePage] = useState("dashboard");
    const [searchQuery, setSearchQuery] = useState('');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [showDashboardPreloader, setShowDashboardPreloader] = useState(true);
    const { t, language } = useLanguage();

    // Central states for real-time reactivity
    const [documents, setDocuments] = useState(() => {
        try {
            const saved = localStorage.getItem('oic_documents');
            const parsed = saved ? JSON.parse(saved) : null;
            if (parsed && parsed.length > 0 && parsed[0].id === 'doc-1') {
                return initialMockData.documents; // Force update to real OIC documents
            }
            return (parsed && parsed.length > 0) ? parsed : initialMockData.documents;
        } catch { return initialMockData.documents; }
    });
    const [oicDocuments, setOicDocuments] = useState(() => {
        try {
            const saved = localStorage.getItem('oic_oicDocuments');
            return saved ? JSON.parse(saved) : initialMockData.oicDocuments;
        } catch { return initialMockData.oicDocuments; }
    });
    const [templates, setTemplates] = useState(() => initialMockData.templates);
    const [kbPending, setKbPending] = useState(() => initialMockData.kbPending);
    const [kbActive, setKbActive] = useState(() => initialMockData.kbActive);
    const [kbArchived, setKbArchived] = useState(() => initialMockData.kbArchived);
    const [monitoringSources, setMonitoringSources] = useState(() => initialMockData.monitoringSources);
    const [users, setUsers] = useState(() => initialMockData.users);
    const [activityLog, setActivityLog] = useState(() => initialMockData.activityLog);

    // Persist documents to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem('oic_documents', JSON.stringify(documents));
    }, [documents]);

    useEffect(() => {
        localStorage.setItem('oic_oicDocuments', JSON.stringify(oicDocuments));
    }, [oicDocuments]);

    useEffect(() => {
        const saved = localStorage.getItem('oic_session');
        if (saved) {
            try {
                const session = JSON.parse(saved);
                if (session.expiry > Date.now()) {
                    setIsAuthenticated(true);
                    setShowDashboardPreloader(true);
                }
            } catch (e) {}
        }
    }, []);

    const handleLogin = () => {
        setIsAuthenticated(true);
        localStorage.setItem('oic_session', JSON.stringify({
            expiry: Date.now() + 24 * 60 * 60 * 1000
        }));
        setShowDashboardPreloader(true);
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        localStorage.removeItem('oic_session');
    };

    const handleDashboardPreloaderComplete = () => {
        setShowDashboardPreloader(false);
    };

    const renderPage = () => {
        const props = { 
            searchQuery, 
            setSearchQuery,
            documents,
            setDocuments,
            oicDocuments,
            setOicDocuments,
            templates,
            setTemplates,
            kbPending,
            setKbPending,
            kbActive,
            setKbActive,
            kbArchived,
            setKbArchived,
            monitoringSources,
            setMonitoringSources,
            users,
            setUsers,
            activityLog,
            setActivityLog,
            setActivePage
        };
        
        switch (activePage) {
            case "dashboard":   return <DashboardPage {...props} />;
            case "documents":   return <DocumentsPage {...props} />;
            case "ask":         return <AskCompliancePage {...props} />;
            case "aiwriter":    return <AIWriterPage {...props} />;
            case "auditor":     return <AuditorPage {...props} />;
            case "templates":   return <TemplatesPage {...props} />;
            case "kb":          return <KnowledgeBasePage {...props} />;
            case "monitoring":  return <MonitoringPage {...props} />;
            case "analytics":   return <AnalyticsPage {...props} />;
            case "members":     return <MembersPage {...props} />;
            case "settings":    return <SettingsPage {...props} />;
            default:            return <DashboardPage {...props} />;
        }
    };

    if (!isAuthenticated) {
        return <LoginPage onLogin={handleLogin} />;
    }

    if (showDashboardPreloader) {
        return <Preloader onComplete={handleDashboardPreloaderComplete} videoSrc="/videos/oic-intro.mp4" />;
    }

    // Calculate margin based on sidebar state (no margin on mobile drawer view)
    const mainMargin = isSidebarCollapsed 
        ? (language === 'ar' ? 'lg:mr-20 lg:ml-0 mr-0 ml-0' : 'lg:ml-20 lg:mr-0 ml-0 mr-0') 
        : (language === 'ar' ? 'lg:mr-64 lg:ml-0 mr-0 ml-0' : 'lg:ml-64 lg:mr-0 ml-0 mr-0');

    return (
        <div className="flex min-h-screen bg-gray-50/30">
            <Sidebar 
                activePage={activePage} 
                setActivePage={setActivePage}
                onCollapseChange={setIsSidebarCollapsed}
            />
            <div className={`flex-1 min-h-screen min-w-0 flex flex-col transition-all duration-300 ease-in-out ${mainMargin}`}>
                <Header 
                    title={t.pages[activePage] || 'Portal'} 
                    onSearch={(query) => {
                        setSearchQuery(query);
                        setActivePage('documents');
                    }}
                    setActivePage={setActivePage}
                    onLogout={handleLogout}
                />
                <main className="flex-1 p-3 sm:p-4 md:p-6 overflow-x-hidden">
                    <div className="max-w-7xl mx-auto">
                        {renderPage()}
                    </div>
                </main>
            </div>
            <VoiceAssistant 
                activePage={activePage} 
                setActivePage={setActivePage}
                documents={documents}
                setDocuments={setDocuments}
                templates={templates}
                setTemplates={setTemplates}
                kbPending={kbPending}
                setKbPending={setKbPending}
                kbActive={kbActive}
                setKbActive={setKbActive}
                kbArchived={kbArchived}
                setKbArchived={setKbArchived}
                monitoringSources={monitoringSources}
                setMonitoringSources={setMonitoringSources}
                users={users}
                setUsers={setUsers}
                activityLog={activityLog}
                setActivityLog={setActivityLog}
            />
        </div>
    );
};

export const App = () => (
    <LanguageProvider>
        <AppInner />
    </LanguageProvider>
);

export default App;