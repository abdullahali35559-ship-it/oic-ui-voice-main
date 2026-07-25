import React, { useState, useEffect } from 'react';

export const TemplatesPage = ({
    templates = [],
    setTemplates,
    setActivePage
}) => {
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedType, setSelectedType] = useState('');
    const [viewingTemplate, setViewingTemplate] = useState(null);
    const [toastMessage, setToastMessage] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);

    useEffect(() => {
        const handleCommand = (e) => {
            if (e.detail && e.detail.action === 'open_add_template') {
                setShowAddModal(true);
            }
        };
        window.addEventListener('templates-command', handleCommand);
        return () => window.removeEventListener('templates-command', handleCommand);
    }, []);

    // New template form states
    const [newTitle, setNewTitle] = useState("");
    const [newDesc, setNewDesc] = useState("");
    const [newContent, setNewContent] = useState("");
    const [newType, setNewType] = useState("Policy");
    const [newCategory, setNewCategory] = useState("Standard");

    // Filter categories and types
    const categories = [...new Set(templates.map(t => t.category))];
    const types = [...new Set(templates.map(t => t.type))];

    const filteredTemplates = templates.filter(t => {
        const matchCat = !selectedCategory || t.category === selectedCategory;
        const matchType = !selectedType || t.type === selectedType;
        return matchCat && matchType;
    });

    const handleUse = (template) => {
        localStorage.setItem('autofill_writer', JSON.stringify({
            title: template.title,
            type: template.type
        }));
        setActivePage('aiwriter');
    };

    const handleExport = (template, format = "DOCX") => {
        setToastMessage(`Exported template "${template.title}" as ${format} successfully.`);
        setTimeout(() => setToastMessage(null), 3000);
    };

    const handleDeleteTemplate = (id, title) => {
        setTemplates(prev => prev.filter(t => t.id !== id));
        setToastMessage(`Template "${title}" deleted successfully.`);
        setTimeout(() => setToastMessage(null), 3000);
    };

    const handleAddTemplate = () => {
        if (!newTitle.trim() || !newDesc.trim()) return;

        const newT = {
            id: Date.now(),
            title: newTitle.trim(),
            desc: newDesc.trim(),
            content: newContent.trim(),
            type: newType,
            category: newCategory
        };

        setTemplates(prev => [newT, ...prev]);
        setShowAddModal(false);
        setNewTitle("");
        setNewDesc("");
        setNewContent("");
        
        setToastMessage(`Template "${newT.title}" created successfully.`);
        setTimeout(() => setToastMessage(null), 3000);
    };

    return (
        <div className="p-6 space-y-6 relative">
            
            {/* Toast Alert */}
            {toastMessage && (
                <div className="fixed top-4 right-4 z-50 bg-[#1a4731] text-white px-4 py-3 rounded-xl shadow-2xl border border-white/20 text-sm font-medium animate-slideIn">
                    {toastMessage}
                </div>
            )}

            <div className="flex items-center justify-between">
                <p className="text-sm text-gray-700">Start a new document from a reusable template.</p>
                <button 
                    onClick={() => setShowAddModal(true)}
                    id="new-template-button"
                    name="new-template"
                    aria-label="New template"
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#1a4731] text-white rounded-lg text-sm font-medium hover:bg-[#153d28] transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    New template
                </button>
            </div>

            <div className="flex gap-3">
                <select 
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    id="template-type"
                    name="template-type"
                    aria-label="all sources"
                    className="px-3 py-2 glass-input rounded-lg text-sm text-gray-700 cursor-pointer focus:outline-none"
                >
                    <option value="">All Types</option>
                    {types.map(tp => <option key={tp} value={tp}>{tp}</option>)}
                </select>
                <select 
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    id="template-category"
                    name="template-category"
                    aria-label="all categories"
                    className="px-3 py-2 glass-input rounded-lg text-sm text-gray-700 cursor-pointer focus:outline-none"
                >
                    <option value="">All Categories</option>
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTemplates.length === 0 ? (
                    <div className="col-span-3 text-center py-10 text-gray-700 text-sm">No templates yet. Create one with + New template.</div>
                ) : filteredTemplates.map((t) => (
                    <div key={t.id} className="glass-card p-5 hover:shadow-xl transition-all flex flex-col justify-between h-48">
                        <div>
                            <div className="flex gap-2 mb-3">
                                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-semibold uppercase">{t.type}</span>
                                <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded text-[10px] font-semibold uppercase">{t.category}</span>
                            </div>
                            <h3 className="text-base font-semibold text-gray-900 mb-1 line-clamp-1">{t.title}</h3>
                            <p className="text-xs text-gray-700 mb-4 line-clamp-2 leading-relaxed">{t.desc}</p>
                        </div>
                        <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100 items-center">
                            <button 
                                onClick={() => handleUse(t)}
                                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#1a4731] text-white rounded-lg text-xs font-medium hover:bg-[#153d28] transition-colors"
                            >
                                Use
                            </button>
                            <button 
                                onClick={() => setViewingTemplate(t)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors"
                            >
                                View
                            </button>
                            <button 
                                onClick={() => handleDeleteTemplate(t.id, t.title)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-red-200 text-red-650 rounded-lg text-xs font-medium hover:bg-red-50 transition-colors"
                            >
                                Delete
                            </button>
                            <select 
                                onChange={(e) => {
                                    if (e.target.value) {
                                        handleExport(t, e.target.value);
                                        e.target.value = "";
                                    }
                                }}
                                aria-label="export template"
                                className="px-2 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-lg text-xs font-medium cursor-pointer hover:bg-gray-50 focus:outline-none"
                            >
                                <option value="">Export</option>
                                <option value="DOCX">DOCX</option>
                                <option value="PDF">PDF</option>
                            </select>
                        </div>
                    </div>
                ))}
            </div>

            {/* View Template Modal */}
            {viewingTemplate && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-slideUp">
                        <div className="flex justify-between items-center pb-3 border-b border-gray-150 mb-4">
                            <h3 className="font-bold text-gray-900 text-lg">{viewingTemplate.title}</h3>
                            <button onClick={() => setViewingTemplate(null)} className="text-gray-700 hover:text-gray-600 font-bold p-1">✕</button>
                        </div>
                        <div className="space-y-4">
                            <div className="flex gap-2">
                                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-semibold uppercase">{viewingTemplate.type}</span>
                                <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs font-semibold uppercase">{viewingTemplate.category}</span>
                            </div>
                            <p className="text-sm text-gray-650 leading-relaxed font-sans">{viewingTemplate.desc}</p>
                            <div className="border border-dashed border-gray-200 rounded-xl p-4 bg-gray-50/50">
                                <span className="text-xs text-gray-700 font-semibold block uppercase tracking-wider mb-2">Template Fields Map</span>
                                <ul className="text-xs text-gray-600 space-y-1.5 list-disc list-inside">
                                    <li>Purpose & Executive Statement</li>
                                    <li>Scope & Application Boundaries</li>
                                    <li>Responsible Compliance Owner (Role)</li>
                                    <li>OIC Policy & Guideline Mapping</li>
                                    <li>Annual Review & Renewal Schedule</li>
                                    <li>Sign-off Approval Workflow</li>
                                </ul>
                            </div>
                        </div>
                        <div className="flex gap-3 pt-6 border-t border-gray-150 mt-6">
                            <button 
                                onClick={() => {
                                    handleUse(viewingTemplate);
                                    setViewingTemplate(null);
                                }}
                                className="flex-1 py-2.5 bg-[#1a4731] text-white rounded-lg text-sm font-medium hover:bg-[#153d28] transition-colors"
                            >
                                Use Template
                            </button>
                            <button 
                                onClick={() => setViewingTemplate(null)}
                                className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Template Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-slideUp space-y-4">
                        <div className="flex justify-between items-center pb-3 border-b border-gray-150">
                            <h3 className="font-bold text-gray-900 text-md">Create Compliance Template</h3>
                            <button onClick={() => setShowAddModal(false)} className="text-gray-700 hover:text-gray-600 font-bold p-1">✕</button>
                        </div>
                        
                        <div className="space-y-3.5 text-sm text-left">
                            <div>
                                <label className="block font-medium text-gray-700 mb-1.5">Template Title</label>
                                <input 
                                    type="text" 
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    id="new-template-title"
                                    name="title"
                                    aria-label="title"
                                    placeholder="Template title" 
                                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a4731]" 
                                />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block font-medium text-gray-700 mb-1.5">Document Type</label>
                                    <select 
                                        value={newType}
                                        onChange={(e) => setNewType(e.target.value)}
                                        id="new-template-type"
                                        name="type"
                                        aria-label="document type"
                                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a4731]"
                                    >
                                        <option value="Policy">Policy</option>
                                        <option value="Procedure">Procedure</option>
                                        <option value="Form">Form</option>
                                        <option value="Checklist">Checklist</option>
                                        <option value="SOP">SOP</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block font-medium text-gray-700 mb-1.5">Category</label>
                                    <select 
                                        value={newCategory}
                                        onChange={(e) => setNewCategory(e.target.value)}
                                        id="new-template-category"
                                        name="category"
                                        aria-label="category"
                                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a4731]"
                                    >
                                        <option value="Standard">Standard</option>
                                        <option value="From document">From document</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block font-medium text-gray-700 mb-1.5">Description</label>
                                <textarea 
                                    rows={3} 
                                    value={newDesc}
                                    onChange={(e) => setNewDesc(e.target.value)}
                                    id="new-template-description"
                                    name="description"
                                    aria-label="description"
                                    placeholder="Template description"
                                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none resize-none focus:ring-2 focus:ring-[#1a4731]" 
                                />
                            </div>

                            <div>
                                <label className="block font-medium text-gray-700 mb-1.5">Content</label>
                                <textarea 
                                    rows={4} 
                                    value={newContent}
                                    onChange={(e) => setNewContent(e.target.value)}
                                    id="new-template-content"
                                    name="content"
                                    aria-label="content"
                                    placeholder="Template content"
                                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none resize-none focus:ring-2 focus:ring-[#1a4731]" 
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4 border-t border-gray-150">
                            <button 
                                onClick={handleAddTemplate}
                                disabled={!newTitle.trim() || !newDesc.trim()}
                                id="create-template-button"
                                name="create-template"
                                aria-label="Create template"
                                className="flex-1 py-2.5 bg-[#1a4731] hover:bg-[#153d28] text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                            >
                                Create template
                            </button>
                            <button 
                                onClick={() => setShowAddModal(false)}
                                id="cancel-template-button"
                                name="cancel-template"
                                aria-label="Cancel"
                                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-255 text-gray-700 rounded-lg text-sm font-medium transition-colors"
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
