import React, { useState, useEffect } from 'react';

export const AIWriterPage = ({
    documents = [],
    setDocuments,
    oicDocuments = [],
    setOicDocuments,
    activityLog = [],
    setActivityLog,
    setActivePage
}) => {
    const [docType, setDocType] = useState("Policy");
    const [title, setTitle] = useState("");
    const [mode, setMode] = useState("guided");
    const [isGenerating, setIsGenerating] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // Guided mode states
    const [purpose, setPurpose] = useState("");
    const [scope, setScope] = useState("");
    const [owner, setOwner] = useState("");
    const [standards, setStandards] = useState("");
    const [reviewDate, setReviewDate] = useState("");
    const [approvalOwner, setApprovalOwner] = useState("");

    // Quick mode states
    const [quickInstructions, setQuickInstructions] = useState("");

    // Versioning states
    const [parentDocId, setParentDocId] = useState(null);
    const [originalVersion, setOriginalVersion] = useState(null);
    const [originalContent, setOriginalContent] = useState("");

    useEffect(() => {
        const handleCommand = (e) => {
            if (!e.detail) return;
            const { action, page, field, value } = e.detail;

            if (page === 'aiwriter') {
                if (action === 'fill') {
                    if (field === 'title') {
                        setTitle(value);
                    } else if (field === 'type') {
                        let typeVal = "Policy";
                        const v = value.toLowerCase();
                        if (v.includes("procedure")) typeVal = "Procedure";
                        else if (v.includes("form")) typeVal = "Form";
                        else if (v.includes("checklist")) typeVal = "Checklist";
                        else if (v.includes("sop")) typeVal = "SOP";
                        setDocType(typeVal);
                    } else if (field === 'guidelines' || field === 'instructions') {
                        setQuickInstructions(value);
                        setPurpose(value);
                    }
                } else if (action === 'save' || action === 'generate') {
                    handleGenerate();
                }
            }
        };
        window.addEventListener('aiwriter-command', handleCommand);
        return () => window.removeEventListener('aiwriter-command', handleCommand);
    }, [title, docType, purpose, quickInstructions, mode]);

    useEffect(() => {
        const saved = localStorage.getItem('autofill_writer');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                if (data.title) setTitle(data.title);
                if (data.type) setDocType(data.type);
                if (data.id) setParentDocId(data.id);
                if (data.version) setOriginalVersion(data.version);
                if (data.originalContent) setOriginalContent(data.originalContent);
                localStorage.removeItem('autofill_writer');
            } catch (e) {}
        }
    }, []);

    const handleRefinePrompt = () => {
        if (!quickInstructions) return;
        setQuickInstructions(prev => 
            `Write a professional OIC policy titled "${title || 'Untitled Document'}".\n\n` +
            `Key Points:\n- ${prev.split('\n').filter(Boolean).map(s => s.trim().replace(/^-\s*/, '')).join('\n- ')}\n\n` +
            `Ensure compliance with OIC guidelines, standard terminology, and appropriate operational controls.`
        );
    };

    const generateMockContent = (isUpdate) => {
        let content = '';

        if (isUpdate) {
            const promptText = quickInstructions || purpose || "General compliance updates applied.";
            
            content += `<div class="mb-4 mt-2 border-t border-gray-200 pt-4"><h3 class="font-bold text-gray-900 mb-2 text-base">AI Generated Update (Draft):</h3></div>`;
            
            content += `<div class="p-5 bg-[#fff9c4] border border-[#fbc02d] rounded-lg mb-6 shadow-sm">`;
            content += `<div class="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2 border-b border-amber-200 pb-1">Proposed Revision based on your instructions</div>`;
            
            // Dynamically generate content based on user's prompt to look realistic
            content += `<div class="font-serif text-gray-900 leading-relaxed text-base">`;
            
            // Try to extract time (like "8 to 4" or "9 to 5")
            let timeMatch = promptText.match(/(?:time\s*)?(\d{1,2}(?:\:\d{2})?\s*(?:am|pm)?\s*to\s*\d{1,2}(?:\:\d{2})?\s*(?:am|pm)?)/i);
            let timeStr = timeMatch ? timeMatch[1] : "the specified official hours";
            
            // Try to extract rule (like "RULE 4", "Rule: 4", "RULE 4 OPEN AND CLOSED SESSIONS")
            let ruleMatch = promptText.match(/(rule\s*:?\s*\d+[^a-z\n]*)/i);
            let ruleTitle = ruleMatch ? ruleMatch[1].toUpperCase().trim() : "[REVISED SECTION]";
            
            if (promptText.toLowerCase().includes('time') || promptText.toLowerCase().includes('add') || promptText.toLowerCase().includes('update')) {
                content += `<p class="mb-3"><strong>${ruleTitle} (UPDATED)</strong></p>`;
                content += `<p class="mb-2">The proceedings and operational sessions of the Committee shall be conducted in accordance with standard OIC compliance guidelines. Unless otherwise decided by a Simple Majority or explicitly stated by the Chair, all official sessions shall strictly operate during ${timeStr}.</p>`;
                content += `<p>All items on the agenda and session proceedings must adhere to these designated timeframes to ensure compliance with administrative controls and member state consultations.</p>`;
            } else {
                content += `<p class="mb-3"><strong>[REVISED SECTION]</strong></p>`;
                content += `<p class="whitespace-pre-wrap">${promptText}</p>`;
            }
            
            content += `<p class="mt-4 pt-3 border-t border-amber-100 text-sm italic text-gray-600">Note: This section has been automatically aligned with standard OIC compliance terminology and operational controls based on your instructions.</p>`;
            content += `</div></div>`;
            
            return content;
        }

        if (docType === "Policy" || docType === "OIC Rules") {
            content += `<div class="mb-4"><h2 class="text-xl font-bold text-[#1a4731]">${title.trim() || `Untitled ${docType}`}</h2></div>`;
        }
        
        if (mode === 'guided') {
            content += `<div class="mb-4 text-sm text-gray-700 leading-relaxed"><p>This document governs OIC compliance operations. It sets forth procedures, responsibilities, standards mappings, and review timelines.</p></div>`;
            if (purpose) content += `<div class="mb-4"><h3 class="font-bold text-gray-900 mb-1 text-base">1. Purpose</h3><p class="text-sm text-gray-700 leading-relaxed">${purpose}</p></div>`;
            else content += `<div class="mb-4"><h3 class="font-bold text-gray-900 mb-1 text-base">1. Purpose</h3><p class="text-sm text-gray-700 leading-relaxed">To establish standard protocols for the OIC.</p></div>`;
            
            if (scope) content += `<div class="mb-4"><h3 class="font-bold text-gray-900 mb-1 text-base">2. Scope</h3><p class="text-sm text-gray-700 leading-relaxed">${scope}</p></div>`;
            
            if (owner || standards) {
                content += `<div class="mb-4"><h3 class="font-bold text-gray-900 mb-1 text-base">3. Responsibilities & Standards</h3><ul class="list-disc pl-5 text-sm text-gray-700 space-y-1">`;
                if (owner) content += `<li><span class="font-semibold">Owner:</span> ${owner}</li>`;
                if (standards) content += `<li><span class="font-semibold">Standards:</span> ${standards}</li>`;
                content += `</ul></div>`;
            }
        } else {
            content += `<div class="mb-4"><h3 class="font-bold text-gray-900 mb-1 text-base">Generated Content</h3>`;
            content += `<p class="text-sm text-gray-800 leading-relaxed font-medium">${quickInstructions}</p>`;
            content += `</div>`;
        }

        return content;
    };

    const handleGenerate = () => {
        setIsGenerating(true);
        
        setTimeout(() => {
            const finalTitle = title.trim() || `Untitled ${docType}`;
            const generatedContent = generateMockContent(!!parentDocId);
            const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            
            let logDetails = `document · title: ${finalTitle} · type: ${docType} · mode: ${mode}`;

            if (parentDocId) {
                // UPDATE existing document
                const updateDocArray = (prev) => prev.map(doc => {
                    if (doc.id === parentDocId) {
                        const currentVersionMatches = (doc.version || "v1").match(/v(\d+)/i);
                        const currentVersionNum = currentVersionMatches ? parseInt(currentVersionMatches[1]) : 1;
                        const newVersionStr = `v${currentVersionNum + 1}`;
                        
                        const historyEntry = {
                            version: doc.version || "v1",
                            date: doc.lastEdited,
                            content: doc.content,
                            pdfFile: doc.pdfFile
                        };

                        return {
                            ...doc,
                            title: finalTitle,
                            type: docType,
                            lastEdited: today,
                            version: newVersionStr,
                            content: generatedContent,
                            pdfFile: doc.pdfFile,
                            history: [...(doc.history || []), historyEntry]
                        };
                    }
                    return doc;
                });

                if (String(parentDocId).startsWith('oic-')) {
                    setOicDocuments(updateDocArray);
                } else {
                    setDocuments(updateDocArray);
                }
                logDetails += ` · updated to version`;
            } else {
                // CREATE new document
                const newDoc = {
                    id: Date.now(),
                    title: finalTitle,
                    type: docType,
                    status: "Draft",
                    owner: "admin@oic.org",
                    lastEdited: today,
                    version: "v1",
                    content: generatedContent
                };
                setDocuments(prev => [newDoc, ...prev]);
            }

            // Add activity log
            const logEntry = {
                time: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ", " + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                user: "admin@oic.org",
                action: parentDocId ? "writer · document updated" : "writer · document generated",
                details: logDetails
            };
            setActivityLog(prev => [logEntry, ...prev]);

            setIsGenerating(false);
            setShowSuccess(true);
            
            // Clear text inputs
            setPurpose("");
            setScope("");
            setOwner("");
            setStandards("");
            setReviewDate("");
            setApprovalOwner("");
            setQuickInstructions("");
            setParentDocId(null);
            setOriginalVersion(null);
            setOriginalContent("");
        }, 1500);
    };

    return (
        <div className="p-6 max-w-3xl mx-auto relative">
            <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-[#1a4731]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </div>
                <div>
                    <h2 className="text-xl font-semibold text-gray-900">AI Document Writer</h2>
                    <p className="text-sm text-gray-700">Draft a compliance document grounded in OIC's approved knowledge base.</p>
                </div>
            </div>

            <div className="glass-card p-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Document type</label>
                        <select 
                            value={docType}
                            onChange={(e) => setDocType(e.target.value)}
                            id="document-type"
                            name="document-type"
                            aria-label="document type"
                            className="w-full px-3 py-2.5 glass-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a4731]"
                        >
                            <option value="Policy">Policy</option>
                            <option value="Procedure">Procedure</option>
                            <option value="Form">Form</option>
                            <option value="Checklist">Checklist</option>
                            <option value="SOP">SOP</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                        <input 
                            type="text" 
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            id="document-title"
                            name="title"
                            aria-label="title"
                            placeholder="Document title" 
                            className="w-full px-3 py-2.5 glass-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a4731]" 
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mode</label>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setMode("guided")} 
                            id="guided-builder-button"
                            name="guided-builder"
                            aria-label="Guided builder"
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === "guided" ? "bg-[#1a4731] text-white" : "bg-white border border-gray-300 text-gray-700 hover:bg-white/20"}`}
                        >
                            Guided builder
                        </button>
                        <button 
                            onClick={() => setMode("quick")} 
                            id="quick-instruction-button"
                            name="quick-instruction"
                            aria-label="Quick instruction"
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === "quick" ? "bg-[#1a4731] text-white" : "bg-white border border-gray-300 text-gray-700 hover:bg-white/20"}`}
                        >
                            Quick instruction
                        </button>
                    </div>
                </div>

                {mode === "guided" ? (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Purpose</label>
                            <textarea 
                                rows={3} 
                                value={purpose}
                                onChange={(e) => setPurpose(e.target.value)}
                                id="document-purpose"
                                name="purpose"
                                aria-label="purpose"
                                placeholder="Purpose"
                                className="w-full px-3 py-2.5 glass-input rounded-lg text-sm focus:outline-none resize-y focus:ring-2 focus:ring-[#1a4731]" 
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Scope</label>
                            <textarea 
                                rows={3} 
                                value={scope}
                                onChange={(e) => setScope(e.target.value)}
                                id="document-scope"
                                name="scope"
                                aria-label="scope"
                                placeholder="Scope"
                                className="w-full px-3 py-2.5 glass-input rounded-lg text-sm focus:outline-none resize-y focus:ring-2 focus:ring-[#1a4731]" 
                            />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Responsible Owner</label>
                                <input 
                                    type="text" 
                                    value={owner}
                                    onChange={(e) => setOwner(e.target.value)}
                                    id="document-owner"
                                    name="owner"
                                    aria-label="owner"
                                    placeholder="Responsible owner"
                                    className="w-full px-3 py-2.5 glass-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a4731]" 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Related Standards</label>
                                <input 
                                    type="text" 
                                    value={standards}
                                    onChange={(e) => setStandards(e.target.value)}
                                    id="document-standards"
                                    name="standards"
                                    aria-label="related standards"
                                    placeholder="Related standards"
                                    className="w-full px-3 py-2.5 glass-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a4731]" 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Review Date</label>
                                <input 
                                    type="text" 
                                    value={reviewDate}
                                    onChange={(e) => setReviewDate(e.target.value)}
                                    id="document-review-date"
                                    name="review-date"
                                    aria-label="review date"
                                    placeholder="Review date"
                                    className="w-full px-3 py-2.5 glass-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a4731]" 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Approval Owner</label>
                                <input 
                                    type="text" 
                                    value={approvalOwner}
                                    onChange={(e) => setApprovalOwner(e.target.value)}
                                    id="document-approval-owner"
                                    name="approval-owner"
                                    aria-label="approval owner"
                                    placeholder="Approval owner"
                                    className="w-full px-3 py-2.5 glass-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a4731]" 
                                />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Instructions</label>
                        <textarea 
                            rows={8} 
                            value={quickInstructions}
                            onChange={(e) => setQuickInstructions(e.target.value)}
                            id="document-instructions"
                            name="instructions"
                            aria-label="key points"
                            placeholder="Instructions"
                            className="w-full px-3 py-2.5 glass-input rounded-lg text-sm focus:outline-none resize-y focus:ring-2 focus:ring-[#1a4731]" 
                        />
                    </div>
                )}

                <div className="flex items-center justify-between pt-4">
                    <p className="text-xs text-gray-700">Drafts are saved to your Documents library for review before use.</p>
                    <div className="flex gap-3">
                        {mode === "quick" && (
                            <button
                                onClick={handleRefinePrompt}
                                disabled={!quickInstructions}
                                id="refine-prompt-button"
                                name="refine-prompt"
                                aria-label="Refine prompt"
                                className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Refine prompt
                            </button>
                        )}
                        <button 
                            onClick={handleGenerate}
                            disabled={isGenerating || (!title && mode === "guided") || (mode === "quick" && !quickInstructions)}
                            id="generate-document-button"
                            name="generate-document"
                            aria-label="Generate document"
                            className={`flex items-center gap-2 px-5 py-2.5 bg-[#1a4731] text-white rounded-lg text-sm font-medium hover:bg-[#153d28] transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            {isGenerating ? (
                                <>
                                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
                                    Generate document
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Success Modal */}
            {showSuccess && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white max-w-md w-full p-6 rounded-2xl shadow-2xl text-center space-y-4 animate-slideUp">
                        <div className="w-12 h-12 bg-green-100 text-green-700 rounded-full flex items-center justify-center mx-auto text-xl">
                            ✓
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Document Draft Created!</h3>
                        <p className="text-sm text-gray-700">Your document has been successfully drafted using the AI generator and saved to the Documents library.</p>
                        
                        <div className="flex gap-3 pt-2">
                            <button 
                                onClick={() => {
                                    setShowSuccess(false);
                                    setActivePage('documents');
                                }}
                                className="flex-1 py-2.5 bg-[#1a4731] text-white rounded-lg text-sm font-medium hover:bg-[#153d28] transition-colors"
                            >
                                View in Library
                            </button>
                            <button 
                                onClick={() => setShowSuccess(false)}
                                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                            >
                                Create Another
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
