import React, { useState, useEffect } from 'react';
import { StatusBadge } from '../components/common/StatusBadge';

export const AuditorPage = ({
    documents = [],
    setDocuments,
    activityLog = [],
    setActivityLog,
    setActivePage
}) => {
    const [tab, setTab] = useState("saved");
    const [searchVal, setSearchVal] = useState("");
    const [selectedDoc, setSelectedDoc] = useState(null);
    
    // File upload state
    const [uploadedFile, setUploadedFile] = useState(null);
    
    // Audit run states
    const [auditProgress, setAuditProgress] = useState(null);
    const [auditResult, setAuditResult] = useState(null);
    const [applyingFixes, setApplyingFixes] = useState(false);

    // Auto-select document if redirected from Documents page
    useEffect(() => {
        const saved = localStorage.getItem('audit_target_doc');
        if (saved) {
            try {
                const doc = JSON.parse(saved);
                setSelectedDoc(doc);
                setTab("saved");
                localStorage.removeItem('audit_target_doc');
            } catch (e) {}
        }
    }, []);

    // Listen for Voice commands directed to the Auditor
    useEffect(() => {
        const handleVoice = (e) => {
            if (e.detail) {
                if (e.detail.action === 'run_audit') {
                    setTab("saved");
                    let doc = null;
                    if (e.detail.docTitle) {
                        doc = documents.find(d => d.title.toLowerCase().includes(e.detail.docTitle.toLowerCase()));
                    }
                    if (!doc && documents.length > 0) {
                        doc = documents[0];
                    }
                    if (doc) {
                        setSelectedDoc(doc);
                        setUploadedFile(null);
                        setAuditResult(null);
                        setAuditProgress(null);
                        runAudit(doc);
                    }
                }
                if (e.detail.action === 'apply_fixes') {
                    applyFixes();
                }
            }
        };
        window.addEventListener('auditor-voice-command', handleVoice);
        return () => window.removeEventListener('auditor-voice-command', handleVoice);
    }, [documents, selectedDoc, uploadedFile]);

    // Filter documents
    const filteredDocs = documents.filter(doc =>
        doc.title.toLowerCase().includes(searchVal.toLowerCase()) ||
        doc.type.toLowerCase().includes(searchVal.toLowerCase())
    );

    const handleSelectDoc = (doc) => {
        setSelectedDoc(doc);
        setUploadedFile(null);
        setAuditResult(null);
        setAuditProgress(null);
    };

    const handleMockUpload = () => {
        setUploadedFile({
            name: "draft_student_cancellation_policy_v1.docx",
            size: "45 KB",
            type: "docx"
        });
        setSelectedDoc(null);
        setAuditResult(null);
        setAuditProgress(null);
    };

    const runAudit = (docToAudit = selectedDoc) => {
        setAuditProgress(0);
        setAuditResult(null);
        
        let progress = 0;
        const interval = setInterval(() => {
            progress += 10;
            setAuditProgress(progress);
            if (progress >= 100) {
                clearInterval(interval);
                setTimeout(() => {
                    setAuditProgress(null);
                    setAuditResult({
                        score: 74,
                        violations: [
                            { id: 1, standard: "OIC Protocol Art. 4", severity: "High", desc: "Policy lacks explicit clearance steps before issuing official communications.", fixed: false },
                            { id: 2, standard: "OIC Records Policy 2.1", severity: "Medium", desc: "No specification of retention periods for Ministerial Council working papers.", fixed: false },
                            { id: 3, standard: "OIC Governance Guideline 7", severity: "Low", desc: "Mentions departmental review but does not name the approving authority.", fixed: false }
                        ],
                        title: docToAudit ? docToAudit.title : (uploadedFile ? uploadedFile.name : "compliance_doc.docx")
                    });
                }, 400);
            }
        }, 150);
    };

    const applyFixes = () => {
        setApplyingFixes(true);
        setTimeout(() => {
            // Update violations list
            setAuditResult(prev => ({
                ...prev,
                score: 100,
                violations: prev.violations.map(v => ({ ...v, fixed: true }))
            }));

            // If a saved document was audited, update its version and status in global state
            if (selectedDoc) {
                let updatedDoc = null;
                const nextVer = `v${parseInt((selectedDoc.version || 'v1').replace('v', '')) + 1}`;
                
                setDocuments(prev => prev.map(doc => {
                    if (doc.id === selectedDoc.id) {
                        updatedDoc = {
                            ...doc,
                            version: nextVer,
                            status: "Reviewed",
                            lastEdited: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        };
                        return updatedDoc;
                    }
                    return doc;
                }));

                if (updatedDoc) {
                    setSelectedDoc(updatedDoc);
                }

                // Log the audit fixes in activityLog
                const logEntry = {
                    time: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ", " + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                    user: "admin@oic.org",
                    action: "auditor · fixes applied",
                    details: `applied: 3 · version: ${nextVer} · report_id: ${Math.random().toString(36).substr(2, 9)}`
                };
                setActivityLog(prev => [logEntry, ...prev]);
            } else {
                // Uploaded transient draft fix
                const logEntry = {
                    time: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ", " + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                    user: "admin@oic.org",
                    action: "auditor · draft updated",
                    details: `fixes applied: 3 · file: ${uploadedFile.name}`
                };
                setActivityLog(prev => [logEntry, ...prev]);
            }

            setApplyingFixes(false);
        }, 1200);
    };

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                </div>
                <div>
                    <h2 className="text-xl font-semibold text-gray-900">Compliance Auditor</h2>
                    <p className="text-sm text-gray-700">Audit a saved document or a one-off draft file against OIC policies and guidelines. Apply fixes with AI to update documents automatically.</p>
                </div>
            </div>

            <div className="flex gap-4">
                <button 
                    onClick={() => {
                        setTab("saved");
                        setAuditResult(null);
                        setAuditProgress(null);
                    }} 
                    id="saved-docs-tab"
                    name="saved-docs-tab"
                    aria-label="Saved documents tab"
                    className={`flex-1 flex items-center gap-3 p-4 rounded-xl border transition-all ${tab === "saved" ? "bg-[#1a4731] text-white border-[#1a4731]" : "bg-white text-gray-700 border-gray-200 hover:bg-white/20"}`}
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    <div className="text-left">
                        <div className="font-medium">Saved document</div>
                        <div className="text-xs opacity-80">Audit an existing document</div>
                    </div>
                </button>
                <button 
                    onClick={() => {
                        setTab("upload");
                        setAuditResult(null);
                        setAuditProgress(null);
                    }} 
                    id="upload-file-tab"
                    name="upload-file-tab"
                    aria-label="Upload file tab"
                    className={`flex-1 flex items-center gap-3 p-4 rounded-xl border transition-all ${tab === "upload" ? "bg-[#1a4731] text-white border-[#1a4731]" : "bg-white text-gray-700 border-gray-200 hover:bg-white/20"}`}
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                    <div className="text-left">
                        <div className="font-medium">Upload a file</div>
                        <div className="text-xs opacity-80">Audit a one-off draft file</div>
                    </div>
                </button>
            </div>

            {/* Target Select View */}
            {tab === "saved" ? (
                <div className="glass-card p-4">
                    <div className="relative mb-4">
                        <input 
                            type="text" 
                            value={searchVal}
                            onChange={(e) => setSearchVal(e.target.value)}
                            id="auditor-search"
                            name="auditor-search"
                            aria-label="auditor search"
                            placeholder="Search saved documents..." 
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a4731]" 
                        />
                        <svg className="w-4 h-4 text-gray-700 absolute left-3 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                    <div className="space-y-2 max-h-56 overflow-y-auto">
                        {filteredDocs.length === 0 ? (
                            <p className="text-center text-sm text-gray-700 py-6">No matching documents found</p>
                        ) : filteredDocs.map((doc, i) => (
                            <div 
                                key={i} 
                                onClick={() => handleSelectDoc(doc)}
                                className={`flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg border cursor-pointer transition-colors ${selectedDoc?.id === doc.id ? 'border-[#1a4731] bg-emerald-500/5' : 'border-gray-100'}`}
                            >
                                <div>
                                    <div className="text-sm font-medium text-gray-900">{doc.title}</div>
                                    <div className="text-xs text-gray-550">{doc.type} &middot; edited {doc.lastEdited} &middot; version {doc.version}</div>
                                </div>
                                <StatusBadge status={doc.status} />
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="glass-card p-6">
                    {uploadedFile ? (
                        <div className="flex items-center justify-between p-4 bg-emerald-50/20 border border-emerald-100 rounded-xl">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">📄</span>
                                <div className="text-left">
                                    <p className="text-sm font-semibold text-gray-900">{uploadedFile.name}</p>
                                    <p className="text-xs text-gray-700">{uploadedFile.size} &middot; Word Document</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setUploadedFile(null)}
                                className="text-gray-700 hover:text-red-600 font-bold p-1 rounded hover:bg-red-50"
                            >
                                Remove
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-250 py-10 rounded-2xl">
                            <span className="text-4xl mb-3">📂</span>
                            <button 
                                onClick={handleMockUpload}
                                id="choose-draft-button"
                                name="choose-draft"
                                aria-label="Choose draft file"
                                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 bg-white shadow-sm font-medium transition-colors"
                            >
                                Choose Draft File
                            </button>
                            <p className="text-xs text-gray-450 mt-2">Select a PDF, DOCX, TXT, or image to analyze</p>
                        </div>
                    )}
                </div>
            )}

            {/* Run Actions Block */}
            {(selectedDoc || uploadedFile) && !auditProgress && !auditResult && (
                <div className="flex justify-end animate-slideUp">
                    <button 
                        onClick={runAudit}
                        className="px-6 py-3 bg-[#1a4731] hover:bg-[#153d28] text-white font-medium text-sm rounded-xl flex items-center gap-2 shadow-md transition-all"
                    >
                        🔍 Run Compliance Audit
                    </button>
                </div>
            )}

            {/* Audit Progress Bar */}
            {auditProgress !== null && (
                <div className="glass-card p-6 space-y-4 animate-pulse">
                    <div className="flex justify-between items-center text-sm font-medium">
                        <span className="text-gray-700">Analyzing document syntax and matching standards...</span>
                        <span className="text-[#1a4731]">{auditProgress}%</span>
                    </div>
                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[#1a4731] rounded-full transition-all duration-150" style={{ width: `${auditProgress}%` }}></div>
                    </div>
                </div>
            )}

            {/* Audit Reports */}
            {auditResult && (
                <div className="space-y-6 animate-slideUp">
                    <div className="glass-card p-6 flex items-center justify-between border border-gray-150 shadow-sm">
                        <div>
                            <span className="text-xs text-gray-700 uppercase font-semibold">Audit Score</span>
                            <div className="flex items-baseline gap-2 mt-1">
                                <span className={`text-4xl font-extrabold ${auditResult.score === 100 ? 'text-green-600' : 'text-amber-600'}`}>{auditResult.score}%</span>
                                <span className="text-gray-450 text-sm">compliance alignment score</span>
                            </div>
                            <p className="text-xs text-gray-700 mt-2">Document audited: <span className="font-semibold text-gray-700">{auditResult.title}</span></p>
                        </div>

                        {auditResult.score < 100 && (
                            <button 
                                onClick={applyFixes}
                                disabled={applyingFixes}
                                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-medium text-sm rounded-lg shadow-md transition-all flex items-center gap-2"
                            >
                                {applyingFixes ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Applying Fixes...
                                    </>
                                ) : (
                                    <>
                                        🪄 Apply AI Auto-Fixes
                                    </>
                                )}
                            </button>
                        )}
                        
                        {auditResult.score === 100 && (
                            <div className="flex items-center gap-2 text-green-700 bg-green-50 px-4 py-2 rounded-xl text-sm font-semibold border border-green-200">
                                <span>✓</span> All Standard Checks Passed!
                            </div>
                        )}
                    </div>

                    <div className="glass-card p-6">
                        <h3 className="text-md font-semibold text-gray-900 mb-4">Standards Audited & Findings</h3>
                        <div className="space-y-4">
                            {auditResult.violations.map(violation => (
                                <div key={violation.id} className={`p-4 rounded-xl border flex gap-4 ${violation.fixed ? 'bg-green-50/20 border-green-150' : 'bg-gray-50/50 border-gray-150'}`}>
                                    <div className="flex-shrink-0 pt-0.5">
                                        {violation.fixed ? (
                                            <span className="inline-flex w-5 h-5 bg-green-100 text-green-700 font-bold rounded-full items-center justify-center text-xs">✓</span>
                                        ) : (
                                            <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold uppercase ${violation.severity === 'High' ? 'bg-red-100 text-red-700' : violation.severity === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>{violation.severity}</span>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm font-bold text-gray-800">{violation.standard}</span>
                                            {violation.fixed && <span className="text-xs text-green-700 font-semibold bg-green-100/50 px-1.5 py-0.5 rounded">RESOLVED</span>}
                                        </div>
                                        <p className="text-sm text-gray-600 mt-1">{violation.desc}</p>
                                        {violation.fixed && (
                                            <p className="text-xs text-green-700 mt-2 bg-green-50/40 p-2 rounded border border-green-100 font-mono">AI Adjustment: Rewritten text to specify a 14-day turnaround refund period and added legal references.</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
