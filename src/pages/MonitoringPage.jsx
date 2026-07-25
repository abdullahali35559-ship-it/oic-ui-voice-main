import React, { useState, useEffect } from 'react';
import { StatusBadge } from '../components/common/StatusBadge';

export const MonitoringPage = ({
    monitoringSources = [],
    setMonitoringSources,
    activityLog = [],
    setActivityLog
}) => {
    const [showAddModal, setShowAddModal] = useState(false);
    const [newSiteName, setNewSiteName] = useState("");
    const [newSiteUrl, setNewSiteUrl] = useState("");

    useEffect(() => {
        const handleCommand = (e) => {
            if (!e.detail) return;
            const { action, page, field, value } = e.detail;

            if (action === 'open_add_monitor') {
                setShowAddModal(true);
            } else if (page === 'monitoring') {
                if (action === 'fill') {
                    if (field === 'site_name') {
                        setNewSiteName(value);
                        setNewSiteUrl(`https://www.${value.toLowerCase().replace(/\s+/g, '')}.gov.au`);
                    } else if (field === 'url') {
                        setNewSiteUrl(value);
                    }
                } else if (action === 'save') {
                    handleAddSubmit();
                } else if (action === 'close') {
                    setShowAddModal(false);
                }
            }
        };
        window.addEventListener('monitoring-command', handleCommand);
        return () => window.removeEventListener('monitoring-command', handleCommand);
    }, [newSiteName, newSiteUrl]);
    const [checkingSourceIndex, setCheckingSourceIndex] = useState(null);
    const [isCheckingAll, setIsCheckingAll] = useState(false);
    const [toast, setToast] = useState(null);

    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(null), 3000);
    };

    const handleCheckNow = (index, source) => {
        setCheckingSourceIndex(index);
        setTimeout(() => {
            const todayStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            
            setMonitoringSources(prev => prev.map((s, idx) => {
                if (idx === index) {
                    return { ...s, checked: todayStr };
                }
                return s;
            }));

            // Add activity log
            const logEntry = {
                time: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ", " + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                user: "admin@oic.org",
                action: "monitoring · site checked",
                details: `site: ${source.name} · status: Ok`
            };
            setActivityLog(prev => [logEntry, ...prev]);

            setCheckingSourceIndex(null);
            showToast(`Compliance site "${source.name}" checked successfully. No changes detected.`);
        }, 1000);
    };

    const handleCheckAll = () => {
        setIsCheckingAll(true);
        setTimeout(() => {
            const todayStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            
            setMonitoringSources(prev => prev.map(s => ({ ...s, checked: todayStr })));

            // Add activity log
            const logEntry = {
                time: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ", " + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                user: "admin@oic.org",
                action: "monitoring · batch checked",
                details: `sites: ${monitoringSources.length}`
            };
            setActivityLog(prev => [logEntry, ...prev]);

            setIsCheckingAll(false);
            showToast(`All ${monitoringSources.length} external compliance sources checked. status OK.`);
        }, 1500);
    };

    const handleDelete = (index, name) => {
        setMonitoringSources(prev => prev.filter((_, idx) => idx !== index));
        showToast(`Compliance site "${name}" removed from monitoring checklist.`);
    };

    const handleAddSubmit = () => {
        if (!newSiteName.trim() || !newSiteUrl.trim()) return;

        const newS = {
            name: newSiteName.trim(),
            url: newSiteUrl.trim().startsWith('http') ? newSiteUrl.trim() : `https://${newSiteUrl.trim()}`,
            status: "Ok",
            checked: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        };

        setMonitoringSources(prev => [...prev, newS]);
        setShowAddModal(false);
        setNewSiteName("");
        setNewSiteUrl("");
        showToast(`Monitoring site "${newS.name}" added successfully.`);
    };

    return (
        <div className="p-6 relative text-sm">
            
            {/* Toast popup */}
            {toast && (
                <div className="fixed top-4 right-4 z-50 bg-[#1a4731] text-white px-4 py-3 rounded-xl shadow-2xl border border-white/20 text-sm font-medium animate-slideIn">
                    {toast}
                </div>
            )}

            <div className="flex items-center justify-between mb-6">
                <p className="text-sm text-gray-700 font-sans">Monitor external compliance sources for changes and assess document impact.</p>
                <div className="flex gap-3">
                    <button 
                        onClick={handleCheckAll}
                        disabled={isCheckingAll || monitoringSources.length === 0}
                        id="check-all-button"
                        name="check-all"
                        aria-label="Check all"
                        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-750 rounded-lg text-sm font-medium hover:bg-gray-55 disabled:opacity-50 transition-colors bg-white/70 shadow-sm"
                    >
                        {isCheckingAll ? (
                            <>
                                <svg className="animate-spin h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Checking...
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                Check all
                            </>
                        )}
                    </button>
                    <button 
                        onClick={() => setShowAddModal(true)}
                        id="add-monitor-source-button"
                        name="add-source"
                        aria-label="Add Source"
                        className="flex items-center gap-2 px-4 py-2.5 bg-[#1a4731] text-white rounded-lg text-sm font-medium hover:bg-[#153d28] transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        Add Source
                    </button>
                </div>
            </div>

            <h3 className="text-sm font-semibold text-gray-900 mb-4">Sources List</h3>
            <div className="space-y-3">
                {monitoringSources.length === 0 ? (
                    <div className="glass-card p-8 text-center text-gray-700">No monitoring sources listed. Add one to start tracking.</div>
                ) : monitoringSources.map((source, i) => (
                    <div key={i} className="glass-card p-5 flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <span className="text-base font-semibold text-gray-900">{source.name}</span>
                                <StatusBadge status={source.status} />
                            </div>
                            <div className="text-sm text-gray-700 font-mono text-xs">{source.url}</div>
                            <div className="text-xs text-gray-450 mt-1">Checked {source.checked}</div>
                        </div>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => handleCheckNow(i, source)}
                                disabled={checkingSourceIndex === i}
                                name="check-now"
                                aria-label="Check now"
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-50 bg-white/70 shadow-sm transition-colors"
                            >
                                {checkingSourceIndex === i ? (
                                    <>
                                        <svg className="animate-spin h-3.5 w-3.5 text-gray-600" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Checking...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                        Check now
                                    </>
                                )}
                            </button>
                            <button 
                                onClick={() => handleDelete(i, source.name)}
                                name="delete"
                                aria-label="Delete"
                                className="p-1.5 text-gray-700 hover:text-red-650 hover:bg-red-50/50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                                title="Remove source"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Add monitor source modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-slideUp text-sm text-gray-700">
                        <div className="flex justify-between items-center pb-3 border-b border-gray-150">
                            <h3 className="font-bold text-gray-900 text-md">Monitor External Compliance Site</h3>
                            <button onClick={() => setShowAddModal(false)} className="text-gray-700 hover:text-gray-600 font-bold p-1">✕</button>
                        </div>
                        
                        <div className="space-y-3.5">
                            <div>
                                <label className="block font-medium text-gray-700 mb-1.5">Compliance Portal Name</label>
                                <input 
                                    type="text" 
                                    value={newSiteName}
                                    onChange={(e) => setNewSiteName(e.target.value)}
                                    id="new-monitor-name"
                                    name="label"
                                    aria-label="label"
                                    placeholder="Compliance portal name" 
                                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a4731]" 
                                />
                            </div>
                            
                            <div>
                                <label className="block font-medium text-gray-700 mb-1.5">Compliance URL</label>
                                <input 
                                    type="text" 
                                    value={newSiteUrl}
                                    onChange={(e) => setNewSiteUrl(e.target.value)}
                                    id="new-monitor-url"
                                    name="url"
                                    aria-label="url"
                                    placeholder="https://example.org" 
                                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a4731]" 
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4 border-t border-gray-150">
                            <button 
                                onClick={handleAddSubmit}
                                disabled={!newSiteName.trim() || !newSiteUrl.trim()}
                                id="add-baseline-button"
                                name="add-baseline"
                                aria-label="Add & Baseline"
                                className="flex-1 py-2.5 bg-[#1a4731] text-white rounded-lg font-medium hover:bg-[#153d28] transition-colors disabled:opacity-50"
                            >
                                Add & Baseline
                            </button>
                            <button 
                                onClick={() => setShowAddModal(false)}
                                id="cancel-monitor-button"
                                name="cancel"
                                aria-label="Cancel"
                                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-255 text-gray-700 rounded-lg font-medium transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
