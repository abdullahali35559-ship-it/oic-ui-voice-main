import React, { useState, useEffect } from 'react';
import { StatusBadge } from '../components/common/StatusBadge';
import { mockData } from '../data/mockData';
import { useLanguage } from '../context/LanguageContext';

const ChevronIcon = ({ open }) => (
    <svg
        className={`w-4 h-4 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
        fill="none" stroke="currentColor" viewBox="0 0 24 24"
    >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
);

const PDFFileIcon = () => (
    <svg className="w-4 h-4 text-red-500 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 1.5L18.5 9H13V3.5z"/>
    </svg>
);

export const DocumentsPage = ({ 
    searchQuery = '', 
    setSearchQuery,
    documents = [],
    setDocuments,
    oicDocuments = [],
    setOicDocuments,
    setActivePage,
    setActivityLog
}) => {
    const { t } = useLanguage();
    const d = t.docs;

    const [oicOpen, setOicOpen] = useState(true);
    const [filterStatus, setFilterStatus] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterFolder, setFilterFolder] = useState('');
    const [filterTag, setFilterTag] = useState('');
    const [localSearch, setLocalSearch] = useState(searchQuery || '');
    const [sortBy, setSortBy] = useState('lastEdited');
    const [sortOrder, setSortOrder] = useState('desc');
    
    // Selection state
    const [selectedDocId, setSelectedDocId] = useState(null);
    const [selectedDocIsOic, setSelectedDocIsOic] = useState(false);
    const [viewingDoc, setViewingDoc] = useState(null);
    const [viewingHistoryVersion, setViewingHistoryVersion] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState('');
    const [toast, setToast] = useState(null);

    // Auto-repair script for broken documents (where pdfFile was lost in earlier versions)
    useEffect(() => {
        let repaired = false;
        const fixedDocs = oicDocuments.map(doc => {
            if (!doc.pdfFile && doc.title && String(doc.id).startsWith('oic-')) {
                // Recover pdfFile based on title or ID
                const mockOriginal = mockData.oicDocuments.find(d => d.id === doc.id);
                if (mockOriginal && mockOriginal.pdfFile) {
                    repaired = true;
                    return { ...doc, pdfFile: mockOriginal.pdfFile };
                }
            }
            return doc;
        });
        if (repaired && setOicDocuments) {
            setOicDocuments(fixedDocs);
        }
    }, [oicDocuments, setOicDocuments]);

    const defaultContent = (doc) => {
        if (doc?.content) return doc.content;
        if (doc?.pdfFile) {
            return `Official OIC rules document: ${doc.pdfFile}\n\nThis document sets out procedures, responsibilities, and governance requirements for OIC member states and affiliated institutions.`;
        }
        return `Title: ${doc?.title || 'Untitled'}\nType: ${doc?.type || 'Document'}\n\nThis document governs OIC compliance operations. It sets forth procedures, responsibilities, standards mappings, and review timelines required under OIC policies and guidelines.\n\n1. Purpose\n2. Scope\n3. Responsibilities\n4. Procedures\n5. Review and approval`;
    };

    // Sync with global searchQuery prop
    useEffect(() => {
        if (searchQuery) {
            setLocalSearch(searchQuery);
        }
    }, [searchQuery]);

    // Update filters to include search and sorting
    const sortDocuments = (docs) => {
        return [...docs].sort((a, b) => {
            let valA = a[sortBy] || '';
            let valB = b[sortBy] || '';
            
            if (sortBy === 'lastEdited') {
                const dateA = new Date(valA);
                const dateB = new Date(valB);
                if (!isNaN(dateA.getTime()) && !isNaN(dateB.getTime())) {
                    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
                }
            }
            
            valA = String(valA).toLowerCase();
            valB = String(valB).toLowerCase();
            if (valA < valB) return sortOrder === 'desc' ? 1 : -1;
            if (valA > valB) return sortOrder === 'desc' ? -1 : 1;
            return 0;
        });
    };

    const filteredDocs = sortDocuments(documents.filter(doc => {
        const matchStatus = !filterStatus || doc.status === filterStatus;
        const matchType = !filterType || filterType === d.rulesAndRegulation ? true : doc.type === filterType;
        const matchSearch = !localSearch || doc.title.toLowerCase().includes(localSearch.toLowerCase());
        if (filterType === d.rulesAndRegulation) return false;
        return matchStatus && matchType && matchSearch;
    }));

    const filteredOic = sortDocuments(oicDocuments.filter(doc => {
        const matchStatus = !filterStatus || doc.status === filterStatus;
        const matchType = !filterType || filterType === d.rulesAndRegulation || doc.type === filterType;
        const matchSearch = !localSearch || doc.title.toLowerCase().includes(localSearch.toLowerCase());
        return matchStatus && matchType && matchSearch;
    }));

    const allTypes = [...new Set(documents.map(d => d.type))];

    const handleDeleteSelected = () => {
        if (!selectedDocId) return;
        if (selectedDocIsOic) {
            setOicDocuments(prev => prev.filter(doc => doc.id !== selectedDocId));
        } else {
            setDocuments(prev => prev.filter(doc => doc.id !== selectedDocId));
        }
        setSelectedDocId(null);
        setSelectedDocIsOic(false);
        setViewingDoc(null);
        setIsEditing(false);
    };

    const handleRowClick = (doc, isOic = false) => {
        setSelectedDocId(doc.id);
        setSelectedDocIsOic(isOic);
        setViewingDoc(doc);
        setIsEditing(false);
        setEditContent(defaultContent(doc));
    };

    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(null), 2500);
    };

    const handleSaveEdit = () => {
        if (!viewingDoc) return;
        const nextVer = `v${parseInt((viewingDoc.version || 'v1').replace('v', '') || '1', 10) + 1}`;
        const lastEdited = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const updated = { ...viewingDoc, content: editContent, version: nextVer, lastEdited };

        if (selectedDocIsOic) {
            setOicDocuments(prev => prev.map(doc => doc.id === viewingDoc.id ? updated : doc));
        } else {
            setDocuments(prev => prev.map(doc => doc.id === viewingDoc.id ? updated : doc));
        }

        if (setActivityLog) {
            setActivityLog(prev => [{
                time: lastEdited + ", " + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                user: "admin@oic.org",
                action: "document · version created",
                details: `document · version: ${nextVer} · title: ${viewingDoc.title}`
            }, ...prev]);
        }

        setViewingDoc(updated);
        setIsEditing(false);
        showToast(`Saved as ${nextVer}. Audit history logged.`);
    };

    const btnClass = "flex items-center gap-2 px-3 py-2 glass-input rounded-lg text-sm text-gray-700 cursor-pointer hover:bg-white/70 transition-colors";

    return (
        <div className="p-6 space-y-6 relative">
            {toast && (
                <div className="fixed top-4 right-4 z-50 bg-[#1a4731] text-white px-4 py-3 rounded-xl shadow-2xl text-sm font-medium">
                    {toast}
                </div>
            )}

            {/* ─── Filter Bar ─── */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex gap-3 flex-wrap">
                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                        id="status" name="status" aria-label="status"
                        className="px-3 py-2 glass-input rounded-lg text-sm text-gray-700 cursor-pointer focus:outline-none">
                        <option value="">{d.allStatuses}</option>
                        <option value="Draft">{d.draft}</option>
                        <option value="Reviewed">{d.reviewed}</option>
                        <option value="Final">{d.final}</option>
                    </select>

                    <select value={filterType} onChange={e => setFilterType(e.target.value)}
                        id="type" name="type" aria-label="type"
                        className="px-3 py-2 glass-input rounded-lg text-sm text-gray-700 cursor-pointer focus:outline-none">
                        <option value="">{d.allTypes}</option>
                        {allTypes.map(tp => <option key={tp} value={tp}>{tp}</option>)}
                        <option value={d.rulesAndRegulation}>{d.rulesAndRegulation}</option>
                    </select>

                    <select value={filterFolder} onChange={e => setFilterFolder(e.target.value)}
                        id="folder" name="folder" aria-label="folder"
                        className="px-3 py-2 glass-input rounded-lg text-sm text-gray-700 cursor-pointer focus:outline-none">
                        <option value="">{d.allFolders}</option>
                        <option value="general">{d.general}</option>
                        <option value="oic">{d.oicDocs}</option>
                        <option value="policies">{d.policies}</option>
                        <option value="contracts">{d.contracts}</option>
                    </select>

                    <select value={filterTag} onChange={e => setFilterTag(e.target.value)}
                        id="tag" name="tag" aria-label="tag"
                        className="px-3 py-2 glass-input rounded-lg text-sm text-gray-700 cursor-pointer focus:outline-none">
                        <option value="">{d.allTags}</option>
                        <option value="compliance">{d.compliance}</option>
                        <option value="oic">OIC</option>
                        <option value="hr">{d.hr}</option>
                        <option value="finance">{d.finance}</option>
                        <option value="safety">{d.safety}</option>
                    </select>
                </div>

                <div className="flex gap-3">
                    <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                        id="sort-by" name="sort-by" aria-label="sort-by"
                        className="px-3 py-2 glass-input rounded-lg text-sm text-gray-700 cursor-pointer focus:outline-none">
                        <option value="lastEdited">{d.lastEdited}</option>
                        <option value="title">{d.colTitle}</option>
                        <option value="type">{d.colType}</option>
                        <option value="status">{d.colStatus}</option>
                    </select>

                    <select value={sortOrder} onChange={e => setSortOrder(e.target.value)}
                        id="sort-order" name="sort-order" aria-label="sort-order"
                        className="px-3 py-2 glass-input rounded-lg text-sm text-gray-700 cursor-pointer focus:outline-none">
                        <option value="desc">{d.desc}</option>
                        <option value="asc">Asc</option>
                    </select>
                    <button 
                        onClick={handleDeleteSelected}
                        disabled={!selectedDocId}
                        className={`flex items-center gap-2 px-3 py-2 glass-input rounded-lg text-sm cursor-pointer transition-colors ${selectedDocId ? 'text-red-600 hover:bg-red-50/50' : 'text-gray-300 cursor-not-allowed'}`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        {d.trash}
                    </button>
                </div>
            </div>

            {/* ─── Main Documents Table ─── */}
            {filterType !== d.rulesAndRegulation && (
                <div className="glass-card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="glass-thead border-b border-white/20">
                                <tr className="text-xs font-medium text-gray-700 uppercase tracking-wider">
                                    <th className="px-6 py-3">{d.colTitle}</th>
                                    <th className="px-6 py-3 whitespace-nowrap">{d.colType}</th>
                                    <th className="px-6 py-3 whitespace-nowrap">{d.colStatus}</th>
                                    <th className="px-6 py-3 whitespace-nowrap">{d.colOwner}</th>
                                    <th className="px-6 py-3 whitespace-nowrap">{d.colLastEdited}</th>
                                    <th className="px-6 py-3 whitespace-nowrap">{d.colVer}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/20">
                                {filteredDocs.length === 0 ? (
                                    <tr><td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-700">{d.noMatch}</td></tr>
                                ) : filteredDocs.map((doc) => (
                                    <tr 
                                        key={doc.id} 
                                        onClick={() => handleRowClick(doc, false)}
                                        className={`glass-row-hover transition-colors cursor-pointer ${selectedDocId === doc.id ? 'bg-emerald-500/10' : ''}`}
                                    >
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{doc.title}</td>
                                        <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">{doc.type}</td>
                                        <td className="px-6 py-4 whitespace-nowrap"><StatusBadge status={doc.status} /></td>
                                        <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">{doc.owner}</td>
                                        <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">{doc.lastEdited}</td>
                                        <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">{doc.version}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ─── OIC Rules & Regulations Category ─── */}
            {(!filterType || filterType === d.rulesAndRegulation) && (
                <div className="glass-card overflow-hidden border border-emerald-100/60">
                    <button
                        onClick={() => setOicOpen(prev => !prev)}
                        className="w-full flex items-center justify-between px-6 py-4 border-b border-white/20 hover:bg-emerald-50/30 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-sm">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                📋 {d.oicCategory}
                            </span>
                            <span className="text-sm text-gray-700">
                                {filteredOic.length} {d.documentsWord}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700">
                            <span className="text-xs font-medium">{oicOpen ? d.collapse : d.expand}</span>
                            <ChevronIcon open={oicOpen} />
                        </div>
                    </button>

                    {oicOpen && (
                        <div className="overflow-x-auto">
                            {filteredOic.length === 0 ? (
                                <p className="px-6 py-8 text-center text-sm text-gray-700">{d.noOicMatch}</p>
                            ) : (
                                <table className="w-full text-left">
                                    <thead className="glass-thead border-b border-white/20">
                                        <tr className="text-xs font-medium text-gray-700 uppercase tracking-wider">
                                            <th className="px-6 py-3">{d.colTitle}</th>
                                            <th className="px-6 py-3 whitespace-nowrap">{d.colType}</th>
                                            <th className="px-6 py-3 whitespace-nowrap">{d.colStatus}</th>
                                            <th className="px-6 py-3 whitespace-nowrap">{d.colOwner}</th>
                                            <th className="px-6 py-3 whitespace-nowrap">{d.colLastEdited}</th>
                                            <th className="px-6 py-3 whitespace-nowrap">{d.colVer}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/20">
                                        {filteredOic.map((doc) => (
                                            <tr
                                                key={doc.id}
                                                onClick={() => handleRowClick(doc, true)}
                                                className={`glass-row-hover transition-colors cursor-pointer group ${selectedDocId === doc.id ? 'bg-emerald-500/10' : ''}`}
                                            >
                                                <td className="px-6 py-4 text-sm font-medium text-emerald-800 max-w-sm">
                                                    <div className="flex items-start gap-2">
                                                        <PDFFileIcon />
                                                        <span className="leading-snug group-hover:underline underline-offset-2">
                                                            {doc.title}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">{doc.type}</td>
                                                <td className="px-6 py-4 whitespace-nowrap"><StatusBadge status={doc.status} /></td>
                                                <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">{doc.owner}</td>
                                                <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">{doc.lastEdited}</td>
                                                <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">{doc.version}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Document Details Drawer / Modal */}
            {viewingDoc && (
                <div className="fixed inset-0 bg-black/35 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className={`w-full bg-white rounded-2xl shadow-2xl flex flex-col p-6 animate-slideUp ${viewingDoc.pdfFile ? 'max-w-5xl h-[95vh]' : 'max-w-2xl max-h-[90vh]'}`}>
                        <div className="flex justify-between items-center pb-4 border-b border-gray-150">
                            <h3 className="text-lg font-semibold text-gray-900 truncate pr-4">{viewingDoc.title}</h3>
                            <button 
                                onClick={() => { setViewingDoc(null); setIsEditing(false); setViewingHistoryVersion(null); }} 
                                className="text-gray-700 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100"
                            >
                                ✕
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto py-6 space-y-6">
                            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl text-sm">
                                <div>
                                    <span className="text-xs text-gray-700 block uppercase font-semibold">Type</span>
                                    <span className="text-gray-800 font-medium">{viewingDoc.type}</span>
                                </div>
                                <div>
                                    <span className="text-xs text-gray-700 block uppercase font-semibold">Status</span>
                                    <div className="mt-1"><StatusBadge status={viewingDoc.status} /></div>
                                </div>
                                <div>
                                    <span className="text-xs text-gray-700 block uppercase font-semibold">Owner</span>
                                    <span className="text-gray-800 break-all">{viewingDoc.owner}</span>
                                </div>
                                <div>
                                    <span className="text-xs text-gray-700 block uppercase font-semibold">Version</span>
                                    {viewingDoc.history && viewingDoc.history.length > 0 ? (
                                        <select 
                                            value={viewingHistoryVersion || viewingDoc.version}
                                            onChange={(e) => setViewingHistoryVersion(e.target.value === viewingDoc.version ? null : e.target.value)}
                                            className="text-gray-800 font-medium bg-white border border-gray-200 rounded px-2 py-0.5 mt-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#1a4731]"
                                        >
                                            <option value={viewingDoc.version}>{viewingDoc.version} (Current)</option>
                                            {viewingDoc.history.map(h => (
                                                <option key={h.version} value={h.version}>{h.version} ({h.date})</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <span className="text-gray-800 font-medium">{viewingDoc.version || "v1"}</span>
                                    )}
                                </div>
                                <div className="col-span-2">
                                    <span className="text-xs text-gray-700 block uppercase font-semibold">Last Edited</span>
                                    <span className="text-gray-800">{viewingDoc.lastEdited}</span>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => showToast("Export started.")}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    Export
                                </button>
                                <button
                                    onClick={() => showToast("Saved as template.")}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    Save as template
                                </button>
                                <button
                                    onClick={() => {
                                        setEditContent(defaultContent(viewingDoc));
                                        setIsEditing(true);
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a4731] text-white rounded-lg text-xs font-medium hover:bg-[#153d28]"
                                >
                                    Edit
                                </button>
                            </div>

                            <div className="space-y-2">
                                <span className="text-xs text-gray-700 block uppercase font-semibold">
                                    {isEditing ? "Edit Document" : "Document Content"}
                                </span>
                                {(() => {
                                    const activeDocPayload = viewingHistoryVersion && viewingDoc.history 
                                        ? viewingDoc.history.find(h => h.version === viewingHistoryVersion) || viewingDoc
                                        : viewingDoc;
                                    
                                    const hasPdf = !!activeDocPayload.pdfFile;
                                    const hasContent = !!activeDocPayload.content;

                                    if (isEditing) {
                                        return (
                                            <div className="space-y-3">
                                                <textarea
                                                    rows={12}
                                                    value={editContent}
                                                    onChange={(e) => setEditContent(e.target.value)}
                                                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#1a4731] resize-y"
                                                />
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={handleSaveEdit}
                                                        className="px-4 py-2 bg-[#1a4731] text-white rounded-lg text-sm font-medium hover:bg-[#153d28]"
                                                    >
                                                        Save changes
                                                    </button>
                                                    <button
                                                        onClick={() => setIsEditing(false)}
                                                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    }
                                    
                                    return (
                                        <div className="flex flex-col gap-6 w-full">
                                            {hasPdf && (
                                                <div className="w-full border border-gray-200 rounded-xl overflow-hidden bg-gray-100 min-h-[50vh] h-[55vh] relative shadow-inner">
                                                    <iframe src={`/pdfs/${activeDocPayload.pdfFile}#view=FitH`} className="w-full h-full border-0 absolute inset-0" title={viewingDoc.title}></iframe>
                                                </div>
                                            )}
                                            {hasContent && (
                                                <div 
                                                    className="w-full text-sm text-gray-800 leading-relaxed whitespace-pre-wrap"
                                                    dangerouslySetInnerHTML={{ __html: activeDocPayload.content.split('<div class="mt-4 p-4 bg-blue-50')[0] }}
                                                />
                                            )}
                                            {!hasPdf && !hasContent && (
                                                <div className="p-4 bg-gray-50/50 border border-gray-100 rounded-xl text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                                                    {defaultContent(activeDocPayload)}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-150 grid grid-cols-2 gap-2.5">
                            {viewingDoc.pdfFile && (
                                <button 
                                    onClick={() => {
                                        window.open(`/pdfs/${viewingDoc.pdfFile}`, '_blank');
                                        setViewingDoc(null);
                                    }}
                                    className="w-full py-2 bg-[#1a4731] text-white rounded-lg text-sm font-medium hover:bg-[#153d28]"
                                >
                                    View Official PDF
                                </button>
                            )}
                            <button 
                                onClick={() => {
                                    localStorage.setItem('audit_target_doc', JSON.stringify(viewingDoc));
                                    setActivePage('auditor');
                                    setViewingDoc(null);
                                }}
                                className={`w-full py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 ${!viewingDoc.pdfFile ? 'col-span-2' : ''}`}
                            >
                                Run Compliance Audit
                            </button>
                            <button 
                                onClick={() => {
                                    localStorage.setItem('autofill_writer', JSON.stringify({
                                        id: viewingDoc.id,
                                        title: viewingDoc.title,
                                        type: viewingDoc.type,
                                        version: viewingDoc.version || "v1",
                                        originalContent: defaultContent(viewingDoc)
                                    }));
                                    setActivePage('aiwriter');
                                    setViewingDoc(null);
                                }}
                                className="w-full py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
                            >
                                Rewrite with AI
                            </button>
                            <button 
                                onClick={() => {
                                    handleDeleteSelected();
                                }}
                                className="w-full py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
                            >
                                Delete Document
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};