import React, { useState, useEffect } from 'react';
import { mockData } from '../data/mockData';

export const AnalyticsPage = ({
    activityLog = [],
    setActivityLog,
    documents = [],
    templates = [],
    kbActive = [],
    users = []
}) => {
    const [tab, setTab] = useState("overview");
    const [period, setPeriod] = useState("30d");

    // Activity Log filtering states
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [actionQuery, setActionQuery] = useState("");
    
    // Committed filter states for Apply button
    const [committedStartDate, setCommittedStartDate] = useState("");
    const [committedEndDate, setCommittedEndDate] = useState("");
    const [committedActionQuery, setCommittedActionQuery] = useState("");
    
    const [toast, setToast] = useState(null);

    useEffect(() => {
        const handleCommand = (e) => {
            if (e.detail) {
                if (e.detail.tab) {
                    setTab(e.detail.tab);
                }
                if (e.detail.period) {
                    setPeriod(e.detail.period);
                }
            }
        };
        window.addEventListener('analytics-command', handleCommand);
        return () => window.removeEventListener('analytics-command', handleCommand);
    }, []);

    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(null), 3000);
    };

    // Calculate period multiplier
    const getPeriodMultiplier = () => {
        switch (period) {
            case "7d": return 0.25;
            case "60d": return 1.8;
            case "30d":
            default: return 1.0;
        }
    };

    const multiplier = getPeriodMultiplier();

    // Scale calculations
    const scaledDocTypes = mockData.docTypes.map(dt => ({
        ...dt,
        count: Math.round(dt.count * multiplier) || 1
    }));
    const scaledAgentUsage = mockData.agentUsage.map(ag => ({
        ...ag,
        count: Math.round(ag.count * multiplier) || 1
    }));

    const maxDocType = Math.max(...scaledDocTypes.map(d => d.count));
    const maxAgent = Math.max(...scaledAgentUsage.map(a => a.count));

    // Filter Activity Logs
    const filteredLogs = activityLog.filter(act => {
        const query = committedActionQuery.trim().toLowerCase();
        const matchAction = !query || 
            act.action.toLowerCase().includes(query) || 
            act.details.toLowerCase().includes(query) || 
            act.user.toLowerCase().includes(query);
            
        let matchStart = true;
        let matchEnd = true;
        if (committedStartDate) {
            const actTime = new Date(act.time);
            const sDate = new Date(committedStartDate);
            if (!isNaN(actTime) && !isNaN(sDate)) {
                matchStart = actTime >= sDate;
            }
        }
        if (committedEndDate) {
            const actTime = new Date(act.time);
            const eDate = new Date(committedEndDate);
            if (!isNaN(actTime) && !isNaN(eDate)) {
                matchEnd = actTime <= eDate;
            }
        }

        return matchAction && matchStart && matchEnd;
    });

    const handleApplyFilters = () => {
        setCommittedStartDate(startDate);
        setCommittedEndDate(endDate);
        setCommittedActionQuery(actionQuery);
    };

    const handleClearFilters = () => {
        setStartDate("");
        setEndDate("");
        setActionQuery("");
        setCommittedStartDate("");
        setCommittedEndDate("");
        setCommittedActionQuery("");
    };

    const handleExportCSV = () => {
        showToast("CSV Export generated successfully. Downloading activity_log.csv...");
    };

    return (
        <div className="p-6 relative text-sm">
            {toast && (
                <div className="fixed top-4 right-4 z-50 bg-[#1a4731] text-white px-4 py-3 rounded-xl shadow-2xl border border-white/20 text-sm font-medium animate-slideIn">
                    {toast}
                </div>
            )}

            <div className="flex items-center justify-between mb-6">
                <div className="flex gap-6 border-b border-gray-200">
                    <button 
                        onClick={() => setTab("overview")} 
                        id="overview-tab"
                        name="overview-tab"
                        aria-label="Overview"
                        className={`pb-3 text-sm font-medium transition-colors ${tab === "overview" ? "text-[#1a4731] border-b-2 border-[#1a4731]" : "text-gray-700 hover:text-gray-700"}`}
                    >
                        Overview
                    </button>
                    <button 
                        onClick={() => setTab("activity")} 
                        id="activity-log-tab"
                        name="activity-log-tab"
                        aria-label="Activity log"
                        className={`pb-3 text-sm font-medium transition-colors ${tab === "activity" ? "text-[#1a4731] border-b-2 border-[#1a4731]" : "text-gray-700 hover:text-gray-700"}`}
                    >
                        Activity Log
                    </button>
                </div>
                <div className="flex gap-1 bg-white/20 rounded-lg p-1 backdrop-blur-sm">
                    {["7d", "30d", "60d"].map((p) => (
                        <button 
                            key={p} 
                            onClick={() => setPeriod(p)} 
                            id={`duration-switch-${p}`}
                            name={`duration-switch-${p}`}
                            aria-label={p}
                            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${period === p ? "bg-white text-[#1a4731] shadow-sm font-semibold" : "text-gray-700 hover:text-gray-750"}`}
                        >
                            {p}
                        </button>
                    ))}
                </div>
            </div>

            {tab === "overview" && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { label: "Documents created", value: Math.round(documents.length * multiplier) },
                            { label: "Audits run", value: Math.round(64 * multiplier) },
                            { label: "Active users", value: Math.round(users.length * multiplier) || 1 },
                            { label: "Most-used agent", value: "Compliance Auditor" },
                        ].map((stat, i) => (
                            <div key={i} className="glass-card p-5">
                                <div className="text-xs text-gray-700 mb-1 uppercase font-semibold">{stat.label}</div>
                                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                            </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="glass-card p-6">
                            <h3 className="text-base font-semibold text-gray-900 mb-4">Top document types</h3>
                            <div className="space-y-3">
                                {scaledDocTypes.map((dt, i) => (
                                    <div key={i} className="flex items-center gap-4">
                                        <span className="w-28 text-sm text-gray-650 truncate">{dt.type}</span>
                                        <div className="flex-1 h-2 bg-white/30 rounded-full overflow-hidden">
                                            <div className="h-full bg-[#1a4731] rounded-full" style={{ width: `${(dt.count / maxDocType) * 100}%` }}></div>
                                        </div>
                                        <span className="w-6 text-sm text-gray-700 text-right">{dt.count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="glass-card p-6">
                            <h3 className="text-base font-semibold text-gray-900 mb-4">Agent usage</h3>
                            <div className="space-y-3">
                                {scaledAgentUsage.map((ag, i) => (
                                    <div key={i} className="flex items-center gap-4">
                                        <span className="w-32 text-sm text-gray-650 truncate">{ag.label}</span>
                                        <div className="flex-1 h-2 bg-white/30 rounded-full overflow-hidden">
                                            <div className="h-full bg-[#1a4731] rounded-full" style={{ width: `${(ag.count / maxAgent) * 100}%` }}></div>
                                        </div>
                                        <span className="w-6 text-sm text-gray-700 text-right">{ag.count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    
                    {/* Recent activity removed for OIC demo */}
                </div>
            )}

            {tab === "activity" && (
                <div className="glass-card p-6 space-y-6">
                    <div className="flex gap-3 flex-wrap items-center">
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs text-gray-700 font-semibold uppercase">From</span>
                            <input 
                                type="date" 
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                id="filter-date-from"
                                name="from"
                                aria-label="from"
                                className="px-3 py-2 glass-input rounded-lg text-sm w-36 focus:outline-none focus:ring-2 focus:ring-[#1a4731]" 
                            />
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs text-gray-700 font-semibold uppercase">To</span>
                            <input 
                                type="date" 
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                id="filter-date-to"
                                name="to"
                                aria-label="to"
                                className="px-3 py-2 glass-input rounded-lg text-sm w-36 focus:outline-none focus:ring-2 focus:ring-[#1a4731]" 
                            />
                        </div>
                        <input 
                            type="text" 
                            value={actionQuery}
                            onChange={(e) => setActionQuery(e.target.value)}
                            id="activity-filter"
                            name="filter"
                            aria-label="filter"
                            placeholder="Filter by action keywords or user..." 
                            className="flex-1 min-w-[200px] px-3 py-2 glass-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a4731]" 
                        />
                        <button 
                            onClick={handleApplyFilters}
                            id="apply-filter-button"
                            name="apply"
                            aria-label="Apply"
                            className="px-4 py-2 bg-[#1a4731] text-white rounded-lg text-sm font-medium hover:bg-[#153d28] transition-colors"
                        >
                            Apply
                        </button>
                        <button 
                            onClick={handleClearFilters}
                            id="clear-filter-button"
                            name="clear"
                            aria-label="Clear"
                            className="px-4 py-2 bg-gray-150 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                        >
                            Clear
                        </button>
                        <button 
                            onClick={handleExportCSV}
                            id="export-filter-button"
                            name="export"
                            aria-label="Export"
                            className="flex items-center gap-2 px-4 py-2 bg-[#1a4731] text-white rounded-lg text-sm font-medium hover:bg-[#153d28] transition-colors disabled:opacity-50"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            Export
                        </button>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-white/20">
                        <table className="w-full text-left">
                            <thead className="glass-thead border-b border-white/20">
                                <tr className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                    <th className="px-4 py-3">Time</th>
                                    <th className="px-4 py-3">User</th>
                                    <th className="px-4 py-3">Action</th>
                                    <th className="px-4 py-3">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/20">
                                {filteredLogs.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-8 text-center text-gray-700">No matching activities logged</td>
                                    </tr>
                                ) : filteredLogs.map((act, i) => (
                                    <tr key={i} className="hover:bg-white/20">
                                        <td className="px-4 py-3 text-xs text-gray-700 whitespace-nowrap">{act.time}</td>
                                        <td className="px-4 py-3 text-xs text-gray-700 whitespace-nowrap font-mono">{act.user}</td>
                                        <td className="px-4 py-3 text-xs font-semibold text-gray-900 whitespace-nowrap uppercase">{act.action}</td>
                                        <td className="px-4 py-3 text-xs text-gray-600 leading-normal">{act.details}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};
