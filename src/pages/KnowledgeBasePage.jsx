import React, { useState, useEffect } from 'react';
import { StatusBadge } from '../components/common/StatusBadge';

export const KnowledgeBasePage = ({
    kbPending = [],
    setKbPending,
    kbActive = [],
    setKbActive,
    kbArchived = [],
    setKbArchived,
    activityLog = [],
    setActivityLog
}) => {
    const [tab, setTab] = useState("pending");
    const [showAddModal, setShowAddModal] = useState(false);
    const [showAddDropdown, setShowAddDropdown] = useState(false);
    const [toast, setToast] = useState(null);

    // Add source form states
    const [sourceName, setSourceName] = useState("");
    const [sourceType, setSourceType] = useState("file");
    const [sourceUrl, setSourceUrl] = useState("");
    const [isIngesting, setIsIngesting] = useState(false);
    
    // View detail state
    const [viewingSource, setViewingSource] = useState(null);

    useEffect(() => {
        const handleCommand = (e) => {
            if (!e.detail) return;
            const { action, tab: newTab, page, field, value } = e.detail;

            if (newTab) {
                setTab(newTab);
            }
            if (action === 'open_add_source') {
                setShowAddModal(true);
            } else if (page === 'kb') {
                if (action === 'fill') {
                    if (field === 'name') {
                        setSourceName(value);
                    } else if (field === 'type') {
                        let typeVal = "web";
                        const v = value.toLowerCase();
                        if (v.includes("file") || v.includes("pdf") || v.includes("document")) typeVal = "file";
                        setSourceType(typeVal);
                    } else if (field === 'url') {
                        setSourceUrl(value);
                    }
                } else if (action === 'save') {
                    handleAddSourceSubmit();
                } else if (action === 'close') {
                    setShowAddModal(false);
                }
            }
        };
        window.addEventListener('kb-command', handleCommand);
        return () => window.removeEventListener('kb-command', handleCommand);
    }, [sourceName, sourceType, sourceUrl]);

    const tabs = [
        { id: "pending", label: "Pending Approval" },
        { id: "active", label: "Active" },
        { id: "archived", label: "Archived" },
        { id: "needsreview", label: "Needs Review" },
    ];

    const showToastMsg = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(null), 3000);
    };

    const handleActivate = (source, fromTab) => {
        // Move from source tab to active
        const activatedSource = {
            ...source,
            status: "Active",
            subStatus: "Ready",
            needsReview: false,
            reviewed: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        };

        if (fromTab === 'pending') {
            setKbPending(prev => prev.filter(s => s.name !== source.name));
        } else if (fromTab === 'archived') {
            setKbArchived(prev => prev.filter(s => s.name !== source.name));
        } else if (fromTab === 'needsreview') {
            // It's already in active state, just clear needsReview flag
            setKbActive(prev => prev.map(s => s.name === source.name ? { ...s, needsReview: false, subStatus: "Ready" } : s));
            showToastMsg(`Source "${source.name}" re-activated successfully.`);
            return;
        }

        setKbActive(prev => [activatedSource, ...prev]);
        showToastMsg(`Source "${source.name}" activated and ready to ground compliance audits.`);

        // Add to log
        const logEntry = {
            time: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ", " + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            user: "admin@oic.org",
            action: "kb · source activated",
            details: `source: ${source.name}`
        };
        setActivityLog(prev => [logEntry, ...prev]);
    };

    const handleArchive = (source, fromTab) => {
        const archivedSource = {
            ...source,
            status: "Archived",
            subStatus: "Not ingested",
            reviewed: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        };

        if (fromTab === 'pending') {
            setKbPending(prev => prev.filter(s => s.name !== source.name));
        } else if (fromTab === 'active' || fromTab === 'needsreview') {
            setKbActive(prev => prev.filter(s => s.name !== source.name));
        }

        setKbArchived(prev => [archivedSource, ...prev]);
        showToastMsg(`Source "${source.name}" moved to archives.`);
    };

    const handleRestore = (source) => {
        const restoredSource = {
            ...source,
            status: "Active",
            subStatus: "Ready",
            reviewed: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        };

        setKbArchived(prev => prev.filter(s => s.name !== source.name));
        setKbActive(prev => [restoredSource, ...prev]);
        showToastMsg(`Source "${source.name}" restored to Active.`);
    };

    const handleMarkNeedsReview = (source) => {
        setKbActive(prev => prev.map(s => {
            if (s.name === source.name) {
                return { ...s, needsReview: true, subStatus: "Review Required" };
            }
            return s;
        }));
        showToastMsg(`Source "${source.name}" flagged for audit verification review.`);
    };

    const handleAddSourceSubmit = () => {
        const name = sourceName.trim() || (sourceType === 'file' ? 'uploaded_compliance_doc.pdf' : sourceUrl.replace('https://', ''));
        if (!name) return;

        setIsIngesting(true);
        setTimeout(() => {
            const newSource = {
                name,
                status: "Pending Approval",
                subStatus: "Ready",
                uploaded: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                reviewed: "—",
                category: sourceType === 'file' ? 'Document Upload' : 'Web Resource',
                error: null
            };

            setKbPending(prev => [newSource, ...prev]);
            setIsIngesting(false);
            setShowAddModal(false);
            setSourceName("");
            setSourceUrl("");
            showToastMsg(`Source "${name}" ingested successfully and is pending approval.`);
        }, 1500);
    };

    const renderSource = (source, actions, fromTab) => (
        <div key={source.name} className="glass-card p-5 mb-3">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <span className="text-base font-semibold text-gray-900">{source.name}</span>
                        <StatusBadge status={source.status} />
                        <StatusBadge status={source.subStatus} />
                        {source.category && <span className="text-xs px-2.5 py-0.5 rounded bg-gray-100 text-gray-700 font-medium">{source.category}</span>}
                    </div>
                    <div className="text-xs text-gray-700 mb-1">Uploaded by admin@oic.org &middot; {source.uploaded}</div>
                    <div className="text-xs text-gray-700 mb-2">Reviewed by admin@oic.org &middot; {source.reviewed}</div>
                    {source.error && (
                        <div className="flex items-start gap-2 text-xs text-red-650 bg-red-50 p-2.5 rounded-lg mt-2 border border-red-100">
                            <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            {source.error}
                        </div>
                    )}
                    {source.note && <div className="text-xs text-gray-700 mt-2 bg-gray-50 p-2 rounded">Note: {source.note}</div>}
                </div>
                <div className="flex gap-2 ml-4">
                    {actions}
                </div>
            </div>
        </div>
    );

    return (
        <div className="p-6 relative">
            
            {/* Toast popup */}
            {toast && (
                <div className="fixed top-4 right-4 z-50 bg-[#1a4731] text-white px-4 py-3 rounded-xl shadow-2xl border border-white/20 text-sm font-medium animate-slideIn">
                    {toast}
                </div>
            )}

            <div className="flex items-center justify-between mb-6">
                <p className="text-sm text-gray-700">Review uploaded sources. Only <span className="font-semibold text-gray-900">Active</span> sources ground the AI; archiving is non-destructive and reversible.</p>
                <div className="relative">
                    <button 
                        onClick={() => setShowAddDropdown(prev => !prev)}
                        id="add-source-dropdown-button"
                        name="add-source-dropdown"
                        aria-label="Add source"
                        className="flex items-center gap-2 px-4 py-2.5 bg-[#1a4731] text-white rounded-lg text-sm font-medium hover:bg-[#153d28] transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        Add source ▾
                    </button>
                    {showAddDropdown && (
                        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-xl py-1 z-50 text-left">
                            <button 
                                onClick={() => {
                                    setSourceType("file");
                                    setShowAddModal(true);
                                    setShowAddDropdown(false);
                                }}
                                id="upload-file-button"
                                name="upload-file"
                                aria-label="Upload file"
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                            >
                                📁 Upload File
                            </button>
                            <button 
                                onClick={() => {
                                    setSourceType("url");
                                    setShowAddModal(true);
                                    setShowAddDropdown(false);
                                }}
                                id="add-web-link-button"
                                name="add-web-link"
                                aria-label="Add web link"
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                            >
                                🌐 Add web link
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex gap-6 border-b border-white/30 mb-6">
                {tabs.map((t) => (
                    <button 
                        key={t.id} 
                        onClick={() => setTab(t.id)} 
                        id={`kb-tab-${t.id}`}
                        name={`kb-tab-${t.id}`}
                        aria-label={t.label}
                        className={`pb-3 text-sm font-medium transition-colors ${tab === t.id ? "text-[#1a4731] border-b-2 border-[#1a4731]" : "text-gray-700 hover:text-gray-700"}`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {tab === "pending" && (
                <div>
                    {kbPending.length === 0 ? (
                        <p className="text-center text-sm text-gray-700 py-10">No pending sources requiring approval.</p>
                    ) : kbPending.map((s) => renderSource(s, [
                        <button key="v" onClick={() => setViewingSource(s)} className="flex items-center gap-1.5 px-3 py-1.5 text-gray-600 hover:bg-white/40 rounded-lg text-xs font-semibold"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>View</button>,
                        <button key="a" onClick={() => handleActivate(s, 'pending')} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a4731] text-white rounded-lg text-xs hover:bg-[#153d28] font-semibold"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Activate</button>,
                        <button key="ar" onClick={() => handleArchive(s, 'pending')} className="flex items-center gap-1.5 px-3 py-1.5 text-gray-600 hover:bg-white/40 rounded-lg text-xs font-semibold"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>Archive</button>
                    ], 'pending'))}
                </div>
            )}
            
            {tab === "active" && (
                <div>
                    {kbActive.length === 0 ? (
                        <p className="text-center text-sm text-gray-700 py-10">No active knowledge base sources.</p>
                    ) : kbActive.map((s) => renderSource(s, [
                        <button key="v" onClick={() => setViewingSource(s)} className="flex items-center gap-1.5 px-3 py-1.5 text-gray-600 hover:bg-white/40 rounded-lg text-xs font-semibold"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>View</button>,
                        <button key="m" onClick={() => handleMarkNeedsReview(s)} className="flex items-center gap-1.5 px-3 py-1.5 text-amber-750 hover:bg-amber-50 rounded-lg text-xs font-semibold"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>Mark needs review</button>,
                        <button key="ar" onClick={() => handleArchive(s, 'active')} className="flex items-center gap-1.5 px-3 py-1.5 text-gray-600 hover:bg-white/40 rounded-lg text-xs font-semibold"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>Archive</button>
                    ], 'active'))}
                </div>
            )}
            
            {tab === "archived" && (
                <div>
                    {kbArchived.length === 0 ? (
                        <p className="text-center text-sm text-gray-700 py-10">No archived sources found.</p>
                    ) : kbArchived.map((s) => renderSource(s, [
                        <button key="v" onClick={() => setViewingSource(s)} className="flex items-center gap-1.5 px-3 py-1.5 text-gray-600 hover:bg-white/40 rounded-lg text-xs font-semibold"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>View</button>,
                        <button key="r" onClick={() => handleRestore(s)} className="flex items-center gap-1.5 px-3 py-1.5 text-gray-700 hover:bg-white/40 rounded-lg text-xs font-semibold"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>Restore</button>
                    ], 'archived'))}
                </div>
            )}

            {tab === "needsreview" && (
                <div>
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
                        <div className="flex items-start gap-2 text-sm text-amber-800">
                            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            <p>Sources here were flagged for review — manually, or automatically when website monitoring detected a change on a matching source. They are <span className="font-semibold">not used by the AI</span> until an admin re-checks them and Activates (or Archives) them.</p>
                        </div>
                    </div>
                    {kbActive.filter(s => s.needsReview).map((s) => renderSource(s, [
                        <button key="v" onClick={() => setViewingSource(s)} className="flex items-center gap-1.5 px-3 py-1.5 text-gray-600 hover:bg-white/40 rounded-lg text-xs font-semibold"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>View</button>,
                        <button key="a" onClick={() => handleActivate(s, 'needsreview')} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a4731] text-white rounded-lg text-xs hover:bg-[#153d28] font-semibold"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Re-Activate</button>,
                        <button key="ar" onClick={() => handleArchive(s, 'needsreview')} className="flex items-center gap-1.5 px-3 py-1.5 text-gray-650 hover:bg-white/40 rounded-lg text-xs font-semibold"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>Archive</button>
                    ], 'needsreview'))}
                    {kbActive.filter(s => s.needsReview).length === 0 && (
                        <p className="text-center text-sm text-gray-700 py-6">No sources currently flagged for review.</p>
                    )}
                </div>
            )}

            {/* Ingest Source Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-slideUp text-sm">
                        <div className="flex justify-between items-center pb-3 border-b border-gray-150">
                            <h3 className="font-bold text-gray-900 text-md">Add Knowledge Base Source</h3>
                            <button onClick={() => setShowAddModal(false)} className="text-gray-700 hover:text-gray-600 font-bold p-1">✕</button>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block font-medium text-gray-700 mb-1.5">Source Connection Type</label>
                                <div className="flex gap-2">
                                    <button 
                                        type="button"
                                        onClick={() => setSourceType("file")} 
                                        className={`flex-1 py-2 rounded-lg font-medium transition-colors text-center ${sourceType === "file" ? "bg-[#1a4731] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                                    >
                                        📁 Local File
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => setSourceType("url")} 
                                        className={`flex-1 py-2 rounded-lg font-medium transition-colors text-center ${sourceType === "url" ? "bg-[#1a4731] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                                    >
                                        🔗 Web URL
                                    </button>
                                </div>
                            </div>

                            {sourceType === "file" ? (
                                <div>
                                    <label className="block font-medium text-gray-700 mb-1.5">Source Name / File</label>
                                    <input 
                                        type="text"
                                        value={sourceName}
                                        onChange={(e) => setSourceName(e.target.value)}
                                        placeholder="Source file name"
                                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a4731] focus:outline-none"
                                    />
                                    <p className="text-[11px] text-gray-700 mt-1">Upload triggers automated OCR text extraction and embeddings.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div>
                                        <label className="block font-medium text-gray-700 mb-1.5">Source Label Name</label>
                                        <input 
                                            type="text"
                                            value={sourceName}
                                            onChange={(e) => setSourceName(e.target.value)}
                                            placeholder="Source label"
                                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a4731] focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block font-medium text-gray-700 mb-1.5">Web URL</label>
                                        <input 
                                            type="url"
                                            value={sourceUrl}
                                            onChange={(e) => setSourceUrl(e.target.value)}
                                            placeholder="https://"
                                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a4731] focus:outline-none"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3 pt-4 border-t border-gray-150">
                            <button 
                                onClick={handleAddSourceSubmit}
                                disabled={isIngesting || (!sourceName.trim() && sourceType === 'file') || (sourceType === 'url' && !sourceUrl.trim())}
                                className="flex-1 py-2.5 bg-[#1a4731] text-white rounded-lg font-medium hover:bg-[#153d28] transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                            >
                                {isIngesting ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Connecting...
                                    </>
                                ) : (
                                    "Start Ingestion"
                                )}
                            </button>
                            <button 
                                onClick={() => setShowAddModal(false)}
                                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* View Source Detail Modal */}
            {viewingSource && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-slideUp text-sm">
                        <div className="flex justify-between items-center pb-3 border-b border-gray-150">
                            <h3 className="font-bold text-gray-900 text-md truncate pr-4">{viewingSource.name}</h3>
                            <button onClick={() => setViewingSource(null)} className="text-gray-700 hover:text-gray-600 font-bold p-1">✕</button>
                        </div>
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3 bg-gray-55 p-3 rounded-xl">
                                <div>
                                    <span className="text-[10px] text-gray-700 uppercase font-bold block">Status</span>
                                    <div className="mt-0.5"><StatusBadge status={viewingSource.status} /></div>
                                </div>
                                <div>
                                    <span className="text-[10px] text-gray-700 uppercase font-bold block">Sub Status</span>
                                    <div className="mt-0.5"><StatusBadge status={viewingSource.subStatus} /></div>
                                </div>
                                <div>
                                    <span className="text-[10px] text-gray-700 uppercase font-bold block">Uploaded</span>
                                    <span className="text-gray-800 font-medium">{viewingSource.uploaded}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] text-gray-700 uppercase font-bold block">Reviewed</span>
                                    <span className="text-gray-800 font-medium">{viewingSource.reviewed}</span>
                                </div>
                            </div>

                            <div>
                                <span className="text-xs text-gray-450 block font-semibold mb-1">Grounding Text Sample (OCR Embeddings)</span>
                                <div className="p-3 bg-gray-50 border border-gray-100 text-xs text-gray-600 leading-relaxed max-h-40 overflow-y-auto rounded-xl">
                                    This compliance standard mandates documentation transparency, official communications protocol, and governance review procedures. Grounded data embeddings map to OIC policy guidelines.
                                </div>
                            </div>
                        </div>
                        <div className="pt-4 border-t border-gray-150 flex justify-end">
                            <button onClick={() => setViewingSource(null)} className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
