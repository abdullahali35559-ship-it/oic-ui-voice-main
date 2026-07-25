import React from 'react';
import { mockData } from '../data/mockData';
import { StatusBadge } from '../components/common/StatusBadge';

export const DashboardPage = ({ 
    setActivePage,
    documents = [],
    oicDocuments = [],
    templates = [],
    kbActive = [],
    users = [],
    activityLog = []
}) => {
    const statCards = [
        { label: "Documents", value: documents.length + oicDocuments.length, icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", color: "bg-green-50 text-green-700" },
        { label: "Templates", value: templates.length, icon: "M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z", color: "bg-green-50 text-green-700" },
        { label: "Approved KB sources", value: kbActive.length, icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253", color: "bg-green-50 text-green-700" },
        { label: "Unread notifications", value: 50, icon: "M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0", color: "bg-red-50 text-red-700" },
        { label: "Audits run (30d)", value: 64, icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z", color: "bg-amber-50 text-amber-700" },
        { label: "Active users (30d)", value: users.length, icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z", color: "bg-purple-50 text-purple-700" },
        { label: "Documents created (30d)", value: documents.length, icon: "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z", color: "bg-emerald-50 text-emerald-700" },
    ];
    return (
        <div className="p-6 space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Welcome back, Admin</h2>
                <p className="text-gray-700 mt-1">Here is an overview of your compliance workspace.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((card, i) => (
                    <div key={i} className="glass-card p-5 hover:shadow-xl transition-all">
                        <div className="flex items-start gap-4">
                            <div className={`w-10 h-10 rounded-lg ${card.color} flex items-center justify-center`}>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d={card.icon} /></svg>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-gray-900">{card.value}</div>
                                <div className="text-sm text-gray-700">{card.label}</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* OIC Documents Section */}
            <div className="glass-card p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        🕌 OIC Rules & Regulations
                    </h3>
                    <button 
                        onClick={() => setActivePage('documents')}
                        className="text-sm text-[#1a4731] hover:underline"
                    >
                        View All →
                    </button>
                </div>
                <div className="space-y-2">
                    {oicDocuments.slice(0, 5).map(doc => (
                        <div 
                            key={doc.id} 
                            onClick={() => window.open(`/pdfs/${doc.pdfFile}`, '_blank')}
                            className="flex items-center justify-between p-3 hover:bg-white/30 rounded-lg transition-colors cursor-pointer"
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-gray-700">📄</span>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">{doc.title}</p>
                                    <p className="text-xs text-gray-700">{doc.type} • {doc.version}</p>
                                </div>
                            </div>
                            <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
                                {doc.status}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: "New document", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", page: "aiwriter" },
                    { label: "Ask Compliance AI", icon: "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z", page: "ask" },
                    { label: "Use a template", icon: "M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z", page: "templates" },
                    { label: "Run an audit", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z", page: "auditor" },
                ].map((btn, i) => (
                    <button key={i} onClick={() => setActivePage(btn.page)} className="flex items-center justify-center gap-2 px-3 py-2.5 glass-card text-xs sm:text-sm font-medium text-gray-700 hover:bg-white/30 transition-colors w-full">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={btn.icon} /></svg>
                        <span className="truncate">{btn.label}</span>
                    </button>
                ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-card p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">Documents by status</h3>
                    <div className="flex items-center justify-center">
                        <div className="relative w-48 h-48">
                            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                                <circle cx="50" cy="50" r="40" fill="none" stroke="#F97316" strokeWidth="16" strokeDasharray="220 251" />
                                <circle cx="50" cy="50" r="40" fill="none" stroke="#1E3A5F" strokeWidth="16" strokeDasharray="20 251" strokeDashoffset="-220" />
                                <circle cx="50" cy="50" r="40" fill="none" stroke="#16A34A" strokeWidth="16" strokeDasharray="11 251" strokeDashoffset="-240" />
                            </svg>
                        </div>
                    </div>
                    <div className="flex justify-center gap-6 mt-4">
                        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-orange-500"></span><span className="text-sm text-gray-700">Draft</span></div>
                        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-[#1a4731]"></span><span className="text-sm text-gray-700">Final</span></div>
                        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-green-600"></span><span className="text-sm text-gray-700">Reviewed</span></div>
                    </div>
                </div>
                <div className="glass-card p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent documents</h3>
                    <div className="space-y-3">
                        {documents.slice(0, 6).map((doc, i) => (
                            <div key={i} className="flex items-center justify-between py-2 border-b border-white/20 last:border-0">
                                <div>
                                    <div className="text-sm font-medium text-gray-900">{doc.title}</div>
                                    <div className="text-xs text-gray-700">{doc.type} &middot; {doc.lastEdited}</div>
                                </div>
                                <StatusBadge status={doc.status} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div className="glass-card p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                    AI agent usage (30 days)
                </h3>
                <div className="space-y-4">
                    {[
                        { label: "Compliance Auditor", value: 65, max: 80 },
                        { label: "Compliance Writer", value: 25, max: 80 },
                        { label: "Q&A", value: 12, max: 80 },
                    ].map((bar, i) => (
                        <div key={i} className="flex items-center gap-4">
                            <span className="w-32 text-sm text-gray-600 text-right">{bar.label}</span>
                            <div className="flex-1 h-8 bg-white/30 rounded-full overflow-hidden">
                                <div className="h-full bg-[#1a4731] rounded-full transition-all" style={{ width: `${(bar.value / bar.max) * 100}%` }}></div>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="flex justify-between text-xs text-gray-700 mt-2 px-36">
                    <span>0</span><span>20</span><span>40</span><span>60</span><span>80</span>
                </div>
            </div>
        </div>
    );
};
