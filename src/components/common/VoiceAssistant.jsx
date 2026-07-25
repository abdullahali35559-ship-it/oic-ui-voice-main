// src/components/common/VoiceAssistant.jsx
import React, { useState, useEffect, useRef } from 'react';
import { mockData } from '../../data/mockData';

// Hardcode OpenRouter details for natural language processing
// Configure this key in your .env or .env.local file as VITE_OPENROUTER_API_KEY
const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || "";
const OPENROUTER_MODEL = "google/gemini-2.5-flash";


export const VoiceAssistant = ({
    activePage,
    setActivePage,
    documents = [],
    setDocuments,
    templates = [],
    setTemplates,
    kbPending = [],
    setKbPending,
    kbActive = [],
    setKbActive,
    kbArchived = [],
    setKbArchived,
    monitoringSources = [],
    setMonitoringSources,
    users = [],
    setUsers,
    activityLog = [],
    setActivityLog
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [status, setStatus] = useState("Ready");
    const [transcript, setTranscript] = useState("");
    const [response, setResponse] = useState("");
    const [isTtsEnabled, setIsTtsEnabled] = useState(() => {
        return localStorage.getItem('voice_tts_enabled') !== 'false';
    });
    const [showSettings, setShowSettings] = useState(false);
    const recognitionRef = useRef(null);
    const shouldListenRef = useRef(false);

    // Keep state values in a mutable ref
    const stateRefs = useRef({});
    stateRefs.current = {
        documents, setDocuments,
        templates, setTemplates,
        kbPending, setKbPending,
        kbActive, setKbActive,
        kbArchived, setKbArchived,
        monitoringSources, setMonitoringSources,
        users, setUsers,
        activityLog, setActivityLog,
        activePage, setActivePage,
        setIsOpen
    };

    const speak = (text) => {
        if (!isTtsEnabled) return;
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            const voices = window.speechSynthesis.getVoices();
            const preferredVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google')) ||
                voices.find(v => v.lang.startsWith('en') && v.name.includes('Natural')) ||
                voices.find(v => v.lang.startsWith('en'));
            if (preferredVoice) utterance.voice = preferredVoice;
            utterance.rate = 1.0;
            window.speechSynthesis.speak(utterance);
        }
    };

    // Initialize speech recognition
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const rec = new SpeechRecognition();
            rec.continuous = false;
            rec.interimResults = false;
            rec.lang = 'en-US';

            rec.onstart = () => {
                setIsListening(true);
                setStatus("Listening...");
            };

            rec.onresult = (event) => {
                const text = event.results[0][0].transcript;
                setTranscript(text);

                const wakeMatch = text.match(/^(?:hey\s+abdul|hay\s+abdul|hi\s+abdul|ok\s+abdul|hello\s+abdul|abdul|abdule|abdool|abdel|abdal|abud|about|apple|able|please|hey|hay|hi|ok|hello)[,.]?\s*(.*)$/i);

                if (wakeMatch) {
                    const command = wakeMatch[1].trim();
                    if (command) {
                        handleVoiceCommand(command);
                    } else {
                        setResponse("Yes, I'm listening. How can I help you?");
                        speak("Yes, I'm listening. How can I help you?");
                    }
                } else {
                    console.log("Wake word not detected:", text);
                }
            };

            rec.onerror = (event) => {
                console.error("Speech recognition error", event.error);
                if (event.error === 'not-allowed') {
                    shouldListenRef.current = false;
                    setIsListening(false);
                    setStatus("Mic Blocked");
                } else {
                    setStatus("Error: " + event.error);
                }
            };

            rec.onend = () => {
                if (shouldListenRef.current) {
                    try { rec.start(); } catch (e) { console.warn(e); }
                } else {
                    setIsListening(false);
                    setStatus("Ready");
                }
            };

            recognitionRef.current = rec;
        }

        if ('speechSynthesis' in window) {
            window.speechSynthesis.getVoices();
        }
    }, []);

    const toggleListening = () => {
        if (!recognitionRef.current) {
            alert("Speech recognition is not supported in this browser.");
            return;
        }

        if (shouldListenRef.current) {
            shouldListenRef.current = false;
            recognitionRef.current.stop();
        } else {
            if (!isOpen) setIsOpen(true);
            shouldListenRef.current = true;
            setTranscript("");
            setResponse("");
            setStatus("Listening...");
            try { recognitionRef.current.start(); } catch (e) { console.warn(e); }
        }
    };

    // ============================================================
    // REACT-CONTROLLED INPUT HELPERS (from Claude)
    // ============================================================

    const getNativeInputValueSetter = (element) => {
        const prototype = element.tagName === 'TEXTAREA'
            ? window.HTMLTextAreaElement.prototype
            : window.HTMLInputElement.prototype;
        return Object.getOwnPropertyDescriptor(prototype, 'value').set;
    };

    const getNativeSelectValueSetter = (element) => {
        return Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set;
    };

    const getNativeCheckedSetter = (element) => {
        return Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'checked').set;
    };

    const setReactInputValue = (element, value) => {
        const nativeSetter = getNativeInputValueSetter(element);
        nativeSetter.call(element, value);
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
    };

    const setReactSelectValue = (element, value) => {
        const nativeSetter = getNativeSelectValueSetter(element);
        nativeSetter.call(element, value);
        element.dispatchEvent(new Event('change', { bubbles: true }));
    };

    const setReactCheckedValue = (element, checked) => {
        const nativeSetter = getNativeCheckedSetter(element);
        nativeSetter.call(element, checked);
        element.dispatchEvent(new Event('click', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
    };

    const findFormElement = (labelQuery, container = document) => {
        const query = labelQuery.toLowerCase().trim();
        const labels = container.querySelectorAll('label');

        for (const label of labels) {
            const labelText = (label.textContent || '').toLowerCase().trim();
            if (!labelText.includes(query)) continue;

            // Case 1: label has htmlFor pointing to an element by id
            if (label.htmlFor) {
                const el = document.getElementById(label.htmlFor);
                if (el) return el;
            }

            // Case 2: input nested inside the label
            const nested = label.querySelector('input, textarea, select');
            if (nested) return nested;

            // Case 3: input is a sibling after the label (common with div wrappers)
            const parent = label.closest('div');
            if (parent) {
                const sibling = parent.querySelector('input, textarea, select');
                if (sibling) return sibling;
            }
        }

        // Fallback: match placeholder, name, id, or aria-label directly
        const candidates = container.querySelectorAll('input, textarea, select');
        for (const el of candidates) {
            const attrs = [
                el.getAttribute('placeholder'),
                el.getAttribute('name'),
                el.getAttribute('id'),
                el.getAttribute('aria-label'),
            ].filter(Boolean).map(s => s.toLowerCase());

            if (attrs.some(a => a.includes(query))) return el;
        }

        return null;
    };

    const fillFormInput = (labelQuery, value, container = document) => {
        const element = findFormElement(labelQuery, container);
        if (!element) {
            console.warn(`fillFormInput: could not find field matching "${labelQuery}"`);
            return false;
        }

        const tag = element.tagName.toLowerCase();
        const type = (element.getAttribute('type') || '').toLowerCase();

        if (tag === 'select') {
            // If value is a string, try to match option text
            if (typeof value === 'string') {
                const options = Array.from(element.options);
                const match = options.find(opt => opt.text.toLowerCase().includes(value.toLowerCase()));
                if (match) {
                    setReactSelectValue(element, match.value);
                    return true;
                }
                // Fallback: set by value directly
                setReactSelectValue(element, value);
            } else {
                setReactSelectValue(element, value);
            }
        } else if (type === 'checkbox' || type === 'radio') {
            setReactCheckedValue(element, Boolean(value));
        } else {
            setReactInputValue(element, value);
        }

        return true;
    };

    // ============================================================
    // HELPER FUNCTIONS
    // ============================================================

    const extractTextBetween = (text, startKeyword, endKeyword = null) => {
        const startIndex = text.toLowerCase().indexOf(startKeyword.toLowerCase());
        if (startIndex === -1) return null;
        let startPos = startIndex + startKeyword.length;
        let endPos = endKeyword ? text.toLowerCase().indexOf(endKeyword.toLowerCase(), startPos) : text.length;
        if (endPos === -1) endPos = text.length;
        const extracted = text.substring(startPos, endPos).trim();
        return extracted.replace(/^(?:called|named|titled|for|about|is|was|the|a|an)\s+/i, '').trim();
    };

    // UPDATED: extractTitle with "title will be" support
    const extractTitle = (text) => {
        let title = null;

        // 1. Handle "title will be X" or "title is X" phrasing
        let match = text.match(/title\s+(?:will be|is|should be)\s+["']?([^"']+?)["']?(?:\s+description|\s*$)/i);
        if (match) title = match[1].trim();

        // 2. Handle "create template X"
        if (!title) {
            match = text.match(/create\s+(?:template|new)\s+["']?([^"']+)["']?(?:\s+for|\s+about|$)/i);
            if (match) title = match[1].trim();
        }

        // 3. Handle "template called X"
        if (!title) {
            match = text.match(/template\s+(?:called|named|titled)\s+["']?([^"']+)["']?/i);
            if (match) title = match[1].trim();
        }

        // 4. Handle "create/add/new/make X template"
        if (!title) {
            match = text.match(/(?:create|add|new|make)\s+(["']?)([^"']+?)\1\s+template/i);
            if (match) title = match[2].trim();
        }

        // 5. Handle "template X"
        if (!title) {
            match = text.match(/template\s+["']?([^"']+)["']?/i);
            if (match) title = match[1].trim();
        }

        // 6. Handle "write X document"
        if (!title) {
            match = text.match(/write\s+(?:a|an)?\s*(?:policy|procedure|form|checklist|sop|document)\s+(?:called|named|titled)?\s*["']?([^"']+)["']?/i);
            if (match) title = match[1].trim();
        }

        // 7. Handle "policy/procedure/form called X"
        if (!title) {
            match = text.match(/(?:policy|procedure|form|checklist|sop|document)\s+(?:called|named|titled)?\s*["']?([^"']+)["']?/i);
            if (match) title = match[1].trim();
        }

        // Clean up
        if (title) {
            title = title.replace(/^(?:called|named|titled|for|about|the|a|an)\s+/i, '');
        }

        return title;
    };

    const extractEmail = (text) => {
        const match = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        return match ? match[0] : null;
    };

    const extractDocType = (text) => {
        if (text.includes('procedure')) return 'Procedure';
        if (text.includes('form')) return 'Form';
        if (text.includes('checklist')) return 'Checklist';
        if (text.includes('sop') || text.includes('standard operating')) return 'SOP';
        return 'Policy';
    };

    const extractSourceName = (text) => {
        let match = text.match(/(?:source|file|document|url)\s+(?:called|named|from)?\s*["']?([^"']+)["']?/i);
        if (match) return match[1].trim();
        match = text.match(/(?:add|ingest|upload)\s+(?:source|file|document)\s+["']?([^"']+)["']?/i);
        if (match) return match[1].trim();
        return null;
    };

    const extractSiteName = (text) => {
        let match = text.match(/(?:site|portal|source)\s+(?:called|named)?\s*["']?([^"']+)["']?/i);
        if (match) return match[1].trim();
        match = text.match(/(?:monitor|add|track)\s+(?:site|source)\s+["']?([^"']+)["']?/i);
        if (match) return match[1].trim();
        return null;
    };

    const extractUrl = (text) => {
        const match = text.match(/https?:\/\/[^\s]+|(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}/i);
        return match ? match[0] : null;
    };

    // ============================================================
    // CLOSE / DISMISS FUNCTIONS
    // ============================================================

    const closeModals = () => {
        const modals = document.querySelectorAll('.fixed.inset-0');
        modals.forEach(modal => {
            const buttons = modal.querySelectorAll('button');
            let found = false;
            for (const btn of buttons) {
                const text = btn.textContent || '';
                const hasX = text.includes('✕') || text.includes('×') || text.includes('X') || text.includes('Close');
                const svg = btn.querySelector('svg');
                const hasClosePath = svg && svg.innerHTML.includes('M6 18L18 6');
                if (hasX || hasClosePath) {
                    btn.click();
                    found = true;
                    break;
                }
            }
            if (!found) {
                const overlay = modal.querySelector('.bg-black\\/30, .bg-black\\/40, .bg-black\\/50');
                if (overlay) overlay.click();
            }
        });
    };

    const closeVoiceAssistant = () => {
        setIsOpen(false);
        shouldListenRef.current = false;
        if (recognitionRef.current) {
            try { recognitionRef.current.stop(); } catch (e) { }
        }
        setIsListening(false);
        setStatus("Ready");
    };

    const closeSidebar = () => {
        const closeBtn = document.querySelector('.lg\\:hidden.fixed.top-4.left-4');
        if (closeBtn) {
            const sidebar = document.querySelector('.glass-sidebar');
            if (sidebar && sidebar.classList.contains('translate-x-0')) {
                closeBtn.click();
            }
        }
    };

    const closeSearch = () => {
        const searchClose = document.querySelector('button:has(span:contains("✕"))');
        if (searchClose) searchClose.click();
    };

    const isModalOpen = () => {
        return document.querySelector('.fixed.inset-0.bg-black\\/30, .fixed.inset-0.bg-black\\/40, .fixed.inset-0.bg-black\\/50') !== null;
    };

    // ============================================================
    // FIND BUTTON BY TEXT
    // ============================================================

    const findButtonByText = (container, textParts) => {
        const buttons = container ? container.querySelectorAll('button') : document.querySelectorAll('button');
        for (const btn of buttons) {
            const btnText = btn.textContent || '';
            for (const part of textParts) {
                if (btnText.includes(part)) {
                    return btn;
                }
            }
        }
        return null;
    };

    // ============================================================
    // FORM FILLING FUNCTIONS (using React-aware fillFormInput)
    // ============================================================

    const fillTemplatesForm = async (data) => {
        const { title, description, content, type, category } = data;
        console.log("📝 Filling Template with:", { title, description, content, type, category });

        await new Promise(resolve => setTimeout(resolve, 500));

        const modalOpen = isModalOpen();

        if (!modalOpen) {
            const addBtn = findButtonByText(null, ['New template', 'Add template']);
            if (addBtn) {
                addBtn.click();
                console.log("✅ Clicked Add Template button");
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        } else {
            console.log("✅ Modal already open, filling directly");
        }

        const modal = document.querySelector('.fixed.inset-0') || document;

        if (title) {
            const success = fillFormInput('title', title, modal);
            if (success) console.log("✅ Filled template title:", title);
            else console.warn("⚠️ Could not fill title field");
        }

        if (description) {
            const success = fillFormInput('description', description, modal);
            if (success) console.log("✅ Filled template description:", description);
        }

        if (type) {
            const success = fillFormInput('type', type, modal);
            if (success) console.log("✅ Filled template type:", type);
        }

        if (category) {
            const success = fillFormInput('category', category, modal);
            if (success) console.log("✅ Filled template category:", category);
        }

        if (content) {
            const success = fillFormInput('content', content, modal);
            if (success) console.log("✅ Filled template content:", content);
        }

        setTimeout(() => {
            const saveBtn = document.getElementById('create-template-button') || findButtonByText(modal, ['Create template', 'Save Template', 'Save', 'Create']);
            if (saveBtn) {
                saveBtn.click();
                console.log("✅ Clicked save button");
                setTimeout(() => closeModals(), 600);
            }
        }, 500);
    };

    const fillAIWriterForm = async (data) => {
        const { title, docType, purpose, scope, owner, quickInstructions } = data;
        console.log("📝 Filling AI Writer with:", { title, docType, purpose, scope, owner });

        await new Promise(resolve => setTimeout(resolve, 500));

        if (title) {
            const success = fillFormInput('title', title);
            if (success) console.log("✅ Filled title:", title);
        }

        if (docType) {
            const success = fillFormInput('type', docType);
            if (success) console.log("✅ Filled document type:", docType);
        }

        if (quickInstructions || purpose || scope || owner) {
            let instructions = `Create a ${docType || 'Policy'} document titled "${title || 'Untitled'}".`;
            if (purpose) instructions += ` Purpose: ${purpose}.`;
            if (scope) instructions += ` Scope: ${scope}.`;
            if (owner) instructions += ` Responsible Owner: ${owner}.`;
            const textarea = document.querySelector('textarea[placeholder*="Draft a 2-page"], textarea[placeholder*="Instructions"]');
            if (textarea) {
                fillFormInput('instructions', instructions);
                console.log("✅ Filled quick instructions");
            }
        }

        setTimeout(() => {
            const generateBtn = findButtonByText(null, ['Generate', 'Generate document']);
            if (generateBtn) {
                generateBtn.click();
                console.log("✅ Clicked generate button");
            }
        }, 500);
    };

    const fillSettingsForm = async (data) => {
        const { action, userEmail, userPassword, userRole } = data;
        console.log("📝 Filling Settings with:", { action, userEmail, userPassword, userRole });

        await new Promise(resolve => setTimeout(resolve, 500));

        if (action === 'add_user' || action === 'create_user') {
            const modalOpen = isModalOpen();

            if (!modalOpen) {
                const addBtn = document.getElementById('new-user-button') || findButtonByText(null, ['New user', 'Add user']);
                if (addBtn) {
                    addBtn.click();
                    console.log("✅ Clicked Add User button");
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            } else {
                console.log("✅ Modal already open, filling directly");
            }

            const modal = document.querySelector('.fixed.inset-0') || document;

            if (userEmail) {
                const success = fillFormInput('email', userEmail, modal);
                if (success) console.log("✅ Filled user email:", userEmail);
            }

            if (userPassword) {
                const success = fillFormInput('password', userPassword, modal);
                if (success) console.log("✅ Filled user password:", userPassword);
            }

            if (userRole) {
                const success = fillFormInput('role', userRole, modal);
                if (success) console.log("✅ Filled user role:", userRole);
            }

            setTimeout(() => {
                const createBtn = document.getElementById('create-user-button') || findButtonByText(modal, ['Create User', 'Create', 'Add']);
                if (createBtn) {
                    createBtn.click();
                    console.log("✅ Clicked Create User button");
                    setTimeout(() => closeModals(), 600);
                }
            }, 500);
        }
    };

    const fillKnowledgeBaseForm = async (data) => {
        const { sourceName, sourceType, sourceUrl } = data;
        console.log("📝 Filling KB with:", { sourceName, sourceType, sourceUrl });

        await new Promise(resolve => setTimeout(resolve, 500));

        const modalOpen = isModalOpen();

        if (!modalOpen) {
            const addBtn = findButtonByText(null, ['Add source', 'Add']);
            if (addBtn) {
                addBtn.click();
                console.log("✅ Clicked Add Source button");
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        } else {
            console.log("✅ Modal already open, filling directly");
        }

        const modal = document.querySelector('.fixed.inset-0') || document;

        if (sourceType === 'url' || sourceType === 'web') {
            const urlBtn = findButtonByText(modal, ['Web URL']);
            if (urlBtn) urlBtn.click();
        } else {
            const fileBtn = findButtonByText(modal, ['Local File']);
            if (fileBtn) fileBtn.click();
        }

        if (sourceName) {
            const success = fillFormInput('name', sourceName, modal);
            if (success) console.log("✅ Filled source name:", sourceName);
        }

        if (sourceType === 'url' && sourceUrl) {
            const success = fillFormInput('url', sourceUrl, modal);
            if (success) console.log("✅ Filled source URL:", sourceUrl);
        }

        setTimeout(() => {
            const submitBtn = findButtonByText(modal, ['Start Ingestion', 'Add', 'Submit']);
            if (submitBtn) {
                submitBtn.click();
                console.log("✅ Clicked Start Ingestion button");
                setTimeout(() => closeModals(), 600);
            }
        }, 500);
    };

    const fillMonitoringForm = async (data) => {
        const { siteName, siteUrl } = data;
        console.log("📝 Filling Monitoring with:", { siteName, siteUrl });

        await new Promise(resolve => setTimeout(resolve, 500));

        const modalOpen = isModalOpen();

        if (!modalOpen) {
            const addBtn = document.getElementById('add-monitor-source-button') || findButtonByText(null, ['Add Source', 'Add source', 'Add']);
            if (addBtn) {
                addBtn.click();
                console.log("✅ Clicked Add Source button");
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        } else {
            console.log("✅ Modal already open, filling directly");
        }

        const modal = document.querySelector('.fixed.inset-0') || document;

        if (siteName) {
            const success = fillFormInput('label', siteName, modal) || fillFormInput('site name', siteName, modal);
            if (success) console.log("✅ Filled site name/label:", siteName);
        }

        if (siteUrl) {
            const success = fillFormInput('url', siteUrl, modal);
            if (success) console.log("✅ Filled site URL:", siteUrl);
        }

        setTimeout(() => {
            const submitBtn = document.getElementById('add-baseline-button') || findButtonByText(modal, ['Add & Baseline', 'Start Monitoring', 'Add', 'Submit']);
            if (submitBtn) {
                submitBtn.click();
                console.log("✅ Clicked Add & Baseline button");
                setTimeout(() => closeModals(), 600);
            }
        }, 500);
    };

    const fillAuditorForm = async (data) => {
        const { docTitle, searchQuery } = data;
        console.log("📝 Filling Auditor with:", { docTitle, searchQuery });

        await new Promise(resolve => setTimeout(resolve, 500));

        if (searchQuery) {
            const searchInput = document.querySelector('input[placeholder*="Search saved documents"]') ||
                document.querySelector('input[type="text"][placeholder*="Search"]');
            if (searchInput) {
                fillFormInput('search', searchQuery);
                console.log("✅ Filled search query:", searchQuery);
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        if (docTitle) {
            const docItems = document.querySelectorAll('.glass-card .flex.items-center.justify-between, .glass-card .flex.items-center.justify-between.p-3');
            for (const doc of docItems) {
                const titleEl = doc.querySelector('.text-sm.font-medium, .text-sm.font-semibold, .text-sm.font-bold');
                if (titleEl && titleEl.textContent.toLowerCase().includes(docTitle.toLowerCase())) {
                    doc.click();
                    console.log("✅ Selected document:", docTitle);

                    setTimeout(() => {
                        const runBtn = findButtonByText(null, ['Run Compliance Audit', 'Run Audit']);
                        if (runBtn) {
                            runBtn.click();
                            console.log("✅ Clicked Run Compliance Audit button");
                        }
                    }, 500);
                    break;
                }
            }
        }
    };

    // ============================================================
    // VOICE COMMAND PROCESSOR
    // ============================================================

    const runLocalParser = (text) => {
        const cleaned = text.toLowerCase().trim();
        const {
            documents, setDocuments,
            templates, setTemplates,
            kbPending, setKbPending,
            kbActive, setKbActive,
            kbArchived, setKbArchived,
            monitoringSources, setMonitoringSources,
            users, setUsers,
            activityLog, setActivityLog,
            activePage, setActivePage
        } = stateRefs.current;

        console.log("🔍 Processing command:", cleaned);

        const findTemplateCard = (titleQuery) => {
            const cards = document.querySelectorAll('.glass-card');
            for (const card of cards) {
                const titleEl = card.querySelector('h3');
                if (titleEl && titleEl.textContent.toLowerCase().includes(titleQuery.toLowerCase())) {
                    return card;
                }
            }
            return null;
        };

        const findSourceCard = (nameQuery) => {
            const cards = document.querySelectorAll('.glass-card');
            for (const card of cards) {
                const titleEl = card.querySelector('.text-base.font-semibold');
                if (titleEl && titleEl.textContent.toLowerCase().includes(nameQuery.toLowerCase())) {
                    return card;
                }
            }
            return null;
        };

        const findMonitorCard = (nameQuery) => {
            const cards = document.querySelectorAll('.glass-card');
            for (const card of cards) {
                const titleEl = card.querySelector('.text-base.font-semibold');
                if (titleEl && titleEl.textContent.toLowerCase().includes(nameQuery.toLowerCase())) {
                    return card;
                }
            }
            return null;
        };

        const findUserRow = (emailQuery) => {
            const rows = document.querySelectorAll('tbody tr');
            for (const row of rows) {
                const emailCell = row.querySelector('td');
                if (emailCell && emailCell.textContent.toLowerCase().includes(emailQuery.toLowerCase())) {
                    return row;
                }
            }
            return null;
        };

        // ============================================================
        // DYNAMIC DOM ELEMENT SOLVERS
        // ============================================================

        const clickElementByText = (textQuery) => {
            const q = textQuery.toLowerCase().trim();
            const elements = Array.from(document.querySelectorAll('button, a, input[type="button"], input[type="submit"], [role="button"], [onclick], .tab-btn, .nav-link'));
            let bestMatch = null;
            for (const el of elements) {
                const text = (el.textContent || el.value || el.getAttribute('aria-label') || '').toLowerCase().trim();
                if (text === q) {
                    bestMatch = el;
                    break;
                }
                if (text && text.includes(q)) {
                    if (!bestMatch || text.length < (bestMatch.textContent || '').length) {
                        bestMatch = el;
                    }
                }
            }
            if (!bestMatch) {
                for (const el of elements) {
                    const title = (el.getAttribute('title') || '').toLowerCase();
                    if (title.includes(q)) {
                        bestMatch = el;
                        break;
                    }
                    const svg = el.querySelector('svg');
                    if (svg && svg.innerHTML.toLowerCase().includes(q)) {
                        bestMatch = el;
                        break;
                    }
                }
            }
            if (bestMatch) {
                bestMatch.click();
                return { success: true, label: bestMatch.textContent || bestMatch.value || 'element' };
            }
            return { success: false };
        };

        // ----- Page Navigation -----
        const pageMappings = [
            { keywords: ["dashboard", "overview", "home", "main"], id: "dashboard", name: "Dashboard" },
            { keywords: ["documents", "document", "library", "files", "docs"], id: "documents", name: "Documents" },
            { keywords: ["ask compliance", "compliance assistant", "chat", "assistant", "agent", "ask"], id: "ask", name: "Compliance Assistant" },
            { keywords: ["ai writer", "writer", "draft", "write", "builder"], id: "aiwriter", name: "AI Writer" },
            { keywords: ["auditor", "audit", "compliance auditor", "check"], id: "auditor", name: "Auditor" },
            { keywords: ["templates", "template"], id: "templates", name: "Templates" },
            { keywords: ["knowledge base", "knowledgebase", "kb", "sources", "kb sources"], id: "kb", name: "Knowledge Base" },
            { keywords: ["monitoring", "monitor", "fair work", "track"], id: "monitoring", name: "Monitoring" },
            { keywords: ["analytics", "logs", "activity", "stats"], id: "analytics", name: "Analytics" },
            { keywords: ["members", "member states", "countries", "states"], id: "members", name: "Members" },
            { keywords: ["settings", "profile", "password", "config", "users"], id: "settings", name: "Settings" }
        ];

        if (cleaned.startsWith("go to ") || cleaned.startsWith("navigate to ") || cleaned.startsWith("open ")) {
            for (const mapping of pageMappings) {
                if (mapping.keywords.some(kw => cleaned.includes(kw))) {
                    setActivePage(mapping.id);
                    return { success: true, reply: `Navigating to ${mapping.name} page.` };
                }
            }
        }

        // ----- Close / Cancel -----
        if (cleaned.includes("close") || cleaned.includes("dismiss") || cleaned.includes("hide") || cleaned.includes("exit") || cleaned.includes("cancel")) {
            if (cleaned.includes("assistant") || cleaned.includes("voice") || cleaned.includes("panel")) {
                closeVoiceAssistant();
                return { success: true, reply: "Closing voice assistant." };
            }
            if (cleaned.includes("sidebar") || cleaned.includes("menu")) {
                closeSidebar();
                return { success: true, reply: "Closing sidebar." };
            }
            if (cleaned.includes("search")) {
                closeSearch();
                return { success: true, reply: "Closing search." };
            }
            closeModals();
            return { success: true, reply: "Closing modal form." };
        }

        // ----- AI Writer Page Commands -----
        if (cleaned.includes("guided") && (cleaned.includes("mode") || cleaned.includes("builder") || cleaned.includes("switch"))) {
            setActivePage("aiwriter");
            setTimeout(() => {
                const btn = document.getElementById('guided-builder-button');
                if (btn) btn.click();
            }, 350);
            return { success: true, reply: "Switching to Guided builder mode." };
        }

        if (cleaned.includes("quick") && (cleaned.includes("mode") || cleaned.includes("instruction") || cleaned.includes("switch"))) {
            setActivePage("aiwriter");
            setTimeout(() => {
                const btn = document.getElementById('quick-instruction-button');
                if (btn) btn.click();
            }, 350);
            return { success: true, reply: "Switching to Quick instruction mode." };
        }

        if (cleaned.includes("refine") && cleaned.includes("prompt")) {
            const btn = document.getElementById('refine-prompt-button');
            if (btn) {
                btn.click();
                return { success: true, reply: "Refining prompt." };
            }
        }

        if (cleaned.includes("generate") && (cleaned.includes("document") || cleaned.includes("policy") || cleaned.includes("writer"))) {
            const btn = document.getElementById('generate-document-button');
            if (btn) {
                btn.click();
                return { success: true, reply: "Generating compliance document." };
            }
        }

        // ----- Auditor Page Commands -----
        if ((cleaned.includes("saved") && (cleaned.includes("document") || cleaned.includes("tab"))) || cleaned === "show saved" || cleaned === "open saved") {
            setActivePage("auditor");
            setTimeout(() => {
                const btn = document.getElementById('saved-docs-tab');
                if (btn) btn.click();
            }, 350);
            return { success: true, reply: "Switching to Saved documents tab." };
        }

        if (cleaned.includes("upload") && (cleaned.includes("tab") || cleaned.includes("file") || cleaned.includes("draft"))) {
            setActivePage("auditor");
            setTimeout(() => {
                const btn = document.getElementById('upload-file-tab');
                if (btn) btn.click();
            }, 350);
            return { success: true, reply: "Switching to Upload draft file tab." };
        }

        if (cleaned.includes("choose") || cleaned === "upload draft" || cleaned === "select draft" || cleaned.includes("choose draft file")) {
            setActivePage("auditor");
            setTimeout(() => {
                const tabBtn = document.getElementById('upload-file-tab');
                if (tabBtn) tabBtn.click();
                setTimeout(() => {
                    const btn = document.getElementById('choose-draft-button');
                    if (btn) btn.click();
                }, 150);
            }, 350);
            return { success: true, reply: "Opening draft file dialog." };
        }

        const auditorSearchMatch = cleaned.match(/^(?:search\s+auditor|search\s+saved|auditor\s+search)\s+(?:for\s+)?(.+)$/i);
        if (auditorSearchMatch) {
            const query = auditorSearchMatch[1].replace(/^["']|["']$/g, '').trim();
            setActivePage("auditor");
            setTimeout(() => {
                const tabBtn = document.getElementById('saved-docs-tab');
                if (tabBtn) tabBtn.click();
                setTimeout(() => {
                    const input = document.getElementById('auditor-search');
                    if (input) {
                        setReactInputValue(input, query);
                        console.log("✅ Wrote to auditor search:", query);
                    }
                }, 100);
            }, 350);
            return { success: true, reply: `Searching auditor for: "${query}".` };
        }

        // ----- KB Tab Switching -----
        if (cleaned.includes("pending approval") && (cleaned.includes("tab") || cleaned.includes("switch") || cleaned.includes("show"))) {
            setActivePage("kb");
            setTimeout(() => {
                const btn = document.getElementById('kb-tab-pending');
                if (btn) btn.click();
            }, 350);
            return { success: true, reply: "Switching to Pending Approval tab." };
        }

        if (cleaned.includes("active") && (cleaned.includes("tab") || cleaned.includes("switch") || cleaned.includes("show")) && !cleaned.includes("activate")) {
            setActivePage("kb");
            setTimeout(() => {
                const btn = document.getElementById('kb-tab-active');
                if (btn) btn.click();
            }, 350);
            return { success: true, reply: "Switching to Active sources tab." };
        }

        if (cleaned.includes("archived") && (cleaned.includes("tab") || cleaned.includes("switch") || cleaned.includes("show")) && !cleaned.includes("archive")) {
            setActivePage("kb");
            setTimeout(() => {
                const btn = document.getElementById('kb-tab-archived');
                if (btn) btn.click();
            }, 350);
            return { success: true, reply: "Switching to Archived sources tab." };
        }

        if ((cleaned.includes("needs review") || cleaned.includes("need review") || cleaned.includes("needsreview")) && (cleaned.includes("tab") || cleaned.includes("switch") || cleaned.includes("show"))) {
            setActivePage("kb");
            setTimeout(() => {
                const btn = document.getElementById('kb-tab-needsreview');
                if (btn) btn.click();
            }, 350);
            return { success: true, reply: "Switching to Needs Review tab." };
        }

        // ----- KB Dropdown Actions -----
        if (cleaned.includes("upload") && cleaned.includes("file") && activePage === "kb") {
            const dd = document.getElementById('add-source-dropdown-button');
            if (dd) {
                dd.click();
                setTimeout(() => {
                    const btn = document.getElementById('upload-file-button');
                    if (btn) btn.click();
                }, 100);
            }
            return { success: true, reply: "Opening local file upload dialog." };
        }

        if ((cleaned.includes("web") || cleaned.includes("link") || cleaned.includes("url")) && (cleaned.includes("add") || cleaned.includes("web link")) && activePage === "kb") {
            const dd = document.getElementById('add-source-dropdown-button');
            if (dd) {
                dd.click();
                setTimeout(() => {
                    const btn = document.getElementById('add-web-link-button');
                    if (btn) btn.click();
                }, 100);
            }
            return { success: true, reply: "Opening web link registration dialog." };
        }

        // ----- KB Card Actions -----
        const viewSourceMatch = cleaned.match(/^(?:view\s+source)\s+(.+)$/i);
        if (viewSourceMatch) {
            const name = viewSourceMatch[1].trim();
            setActivePage("kb");
            setTimeout(() => {
                const card = findSourceCard(name);
                if (card) {
                    const btn = findButtonByText(card, ['View']);
                    if (btn) btn.click();
                }
            }, 350);
            return { success: true, reply: `Viewing source "${name}".` };
        }

        const activateSourceMatch = cleaned.match(/^(?:activate|reactivate|re-activate)\s+source\s+(.+)$/i);
        if (activateSourceMatch) {
            const name = activateSourceMatch[1].trim();
            setActivePage("kb");
            setTimeout(() => {
                const card = findSourceCard(name);
                if (card) {
                    const btn = findButtonByText(card, ['Activate', 'Re-Activate']);
                    if (btn) btn.click();
                }
            }, 350);
            return { success: true, reply: `Activating source "${name}".` };
        }

        const archiveSourceMatch = cleaned.match(/^(?:archive\s+source)\s+(.+)$/i);
        if (archiveSourceMatch) {
            const name = archiveSourceMatch[1].trim();
            setActivePage("kb");
            setTimeout(() => {
                const card = findSourceCard(name);
                if (card) {
                    const btn = findButtonByText(card, ['Archive']);
                    if (btn) btn.click();
                }
            }, 350);
            return { success: true, reply: `Archiving source "${name}".` };
        }

        const restoreSourceMatch = cleaned.match(/^(?:restore\s+source)\s+(.+)$/i);
        if (restoreSourceMatch) {
            const name = restoreSourceMatch[1].trim();
            setActivePage("kb");
            setTimeout(() => {
                const card = findSourceCard(name);
                if (card) {
                    const btn = findButtonByText(card, ['Restore']);
                    if (btn) btn.click();
                }
            }, 350);
            return { success: true, reply: `Restoring source "${name}".` };
        }

        const reviewSourceMatch = cleaned.match(/^(?:review\s+source|mark\s+source\s+(.+?)\s+needs\s+review)$/i);
        if (reviewSourceMatch) {
            let name = "";
            if (cleaned.startsWith("review source")) {
                name = cleaned.replace("review source", "").trim();
            } else {
                name = reviewSourceMatch[1].trim();
            }
            setActivePage("kb");
            setTimeout(() => {
                const card = findSourceCard(name);
                if (card) {
                    const btn = findButtonByText(card, ['Mark needs review']);
                    if (btn) btn.click();
                }
            }, 350);
            return { success: true, reply: `Flagging source "${name}" for review.` };
        }


        // ----- Monitoring Page Commands -----
        if (cleaned === "check all" || cleaned === "check all sites" || cleaned === "check all sources") {
            setActivePage("monitoring");
            setTimeout(() => {
                const btn = document.getElementById('check-all-button');
                if (btn) btn.click();
            }, 350);
            return { success: true, reply: "Checking all monitoring sources." };
        }

        const checkSiteMatch = cleaned.match(/^(?:check\s+site|check\s+source|check\s+now)\s+(.+)$/i);
        if (checkSiteMatch) {
            const name = checkSiteMatch[1].trim();
            setActivePage("monitoring");
            setTimeout(() => {
                const card = findMonitorCard(name);
                if (card) {
                    const btn = findButtonByText(card, ['Check now']);
                    if (btn) btn.click();
                }
            }, 350);
            return { success: true, reply: `Checking monitoring source "${name}" now.` };
        }

        const deleteSiteMatch = cleaned.match(/^(?:delete\s+site|delete\s+source|remove\s+site|remove\s+source)\s+(.+)$/i);
        if (deleteSiteMatch) {
            const name = deleteSiteMatch[1].trim();
            setActivePage("monitoring");
            setTimeout(() => {
                const card = findMonitorCard(name);
                if (card) {
                    const btn = card.querySelector('button[aria-label="Delete"]') || card.querySelector('button[title="Remove source"]') || findButtonByText(card, ['Delete', 'Remove']);
                    if (btn) btn.click();
                }
            }, 350);
            return { success: true, reply: `Removing site "${name}" from monitoring checklist.` };
        }


        // ----- Analytics Page Commands -----
        if (cleaned.includes("overview") && (cleaned.includes("tab") || cleaned.includes("switch") || cleaned.includes("show"))) {
            setActivePage("analytics");
            setTimeout(() => {
                const btn = document.getElementById('overview-tab');
                if (btn) btn.click();
            }, 350);
            return { success: true, reply: "Switching to Analytics Overview." };
        }

        if (cleaned.includes("activity log") && (cleaned.includes("tab") || cleaned.includes("switch") || cleaned.includes("show"))) {
            setActivePage("analytics");
            setTimeout(() => {
                const btn = document.getElementById('activity-log-tab');
                if (btn) btn.click();
            }, 350);
            return { success: true, reply: "Switching to Activity Log tab." };
        }

        const durationMatch = cleaned.match(/^(?:switch\s+period\s+to|set\s+duration\s+to|set\s+period\s+to|switch\s+to|duration)\s+(7d|30d|60d|7\s+days|30\s+days|60\s+days)$/i);
        if (durationMatch) {
            let days = durationMatch[1].toLowerCase().replace(/\s+days/g, 'd');
            setActivePage("analytics");
            setTimeout(() => {
                const btn = document.getElementById(`duration-switch-${days}`);
                if (btn) btn.click();
            }, 350);
            return { success: true, reply: `Setting analytics period to ${days}.` };
        }

        const dateFromMatch = cleaned.match(/^(?:set\s+filter\s+from|filter\s+from)\s+(.+)$/i);
        if (dateFromMatch) {
            const dateVal = dateFromMatch[1].trim();
            setActivePage("analytics");
            setTimeout(() => {
                const tabBtn = document.getElementById('activity-log-tab');
                if (tabBtn) tabBtn.click();
                setTimeout(() => {
                    const input = document.getElementById('filter-date-from');
                    if (input) {
                        setReactInputValue(input, dateVal);
                    }
                }, 100);
            }, 350);
            return { success: true, reply: `Setting filter start date to ${dateVal}.` };
        }

        const dateToMatch = cleaned.match(/^(?:set\s+filter\s+to|filter\s+to)\s+(.+)$/i);
        if (dateToMatch) {
            const dateVal = dateToMatch[1].trim();
            setActivePage("analytics");
            setTimeout(() => {
                const tabBtn = document.getElementById('activity-log-tab');
                if (tabBtn) tabBtn.click();
                setTimeout(() => {
                    const input = document.getElementById('filter-date-to');
                    if (input) {
                        setReactInputValue(input, dateVal);
                    }
                }, 100);
            }, 350);
            return { success: true, reply: `Setting filter end date to ${dateVal}.` };
        }

        const filterActivityMatch = cleaned.match(/^(?:filter\s+activity\s+for|filter\s+activity\s+log\s+for|filter\s+activity|filter\s+log)\s+(.+)$/i);
        if (filterActivityMatch) {
            const query = filterActivityMatch[1].replace(/^["']|["']$/g, '').trim();
            setActivePage("analytics");
            setTimeout(() => {
                const tabBtn = document.getElementById('activity-log-tab');
                if (tabBtn) tabBtn.click();
                setTimeout(() => {
                    const input = document.getElementById('activity-filter');
                    if (input) {
                        setReactInputValue(input, query);
                    }
                }, 100);
            }, 350);
            return { success: true, reply: `Setting log filter keyword to "${query}".` };
        }

        if (cleaned === "apply filter" || cleaned === "apply filters" || cleaned === "apply") {
            const btn = document.getElementById('apply-filter-button');
            if (btn) {
                btn.click();
                return { success: true, reply: "Applying filters." };
            }
        }

        if (cleaned === "clear filter" || cleaned === "clear filters" || cleaned === "clear") {
            const btn = document.getElementById('clear-filter-button');
            if (btn) {
                btn.click();
                return { success: true, reply: "Clearing filters." };
            }
        }

        if (cleaned.includes("export") && (cleaned.includes("activity") || cleaned.includes("csv") || cleaned.includes("log"))) {
            setActivePage("analytics");
            setTimeout(() => {
                const tabBtn = document.getElementById('activity-log-tab');
                if (tabBtn) tabBtn.click();
                setTimeout(() => {
                    const btn = document.getElementById('export-filter-button');
                    if (btn) btn.click();
                }, 100);
            }, 350);
            return { success: true, reply: "Exporting activity log as CSV." };
        }


        // ----- Header / Layout Commands -----
        if (cleaned.includes("search") && cleaned.includes("for") && !cleaned.includes("auditor")) {
            const searchMatch = cleaned.match(/^(?:search\s+(?:the\s+portal\s+|the\s+site\s+|for\s+)?)(.+)$/i);
            if (searchMatch) {
                const query = searchMatch[1].replace(/^(?:for\s+)/i, '').replace(/^["']|["']$/g, '').trim();
                const input = document.getElementById('header-search') || document.getElementById('mobile-search-input');
                if (input) {
                    setReactInputValue(input, query);
                    const form = input.closest('form');
                    if (form) {
                        form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                    }
                    return { success: true, reply: `Searching the portal for: "${query}".` };
                }
            }
        }

        if (cleaned === "open notifications" || cleaned === "show notifications" || cleaned === "click notification" || cleaned === "open notification menu") {
            const btn = document.getElementById('notification-button');
            if (btn) {
                btn.click();
                return { success: true, reply: "Opening notifications window." };
            }
        }

        if (cleaned === "mark all read" || cleaned === "mark all notifications read" || cleaned === "mark notifications read") {
            const btn = document.getElementById('notification-button');
            if (btn) {
                const markBtn = document.getElementById('mark-all-read-button');
                if (markBtn) {
                    markBtn.click();
                } else {
                    btn.click();
                    setTimeout(() => {
                        const mBtn = document.getElementById('mark-all-read-button');
                        if (mBtn) mBtn.click();
                    }, 150);
                }
                return { success: true, reply: "Marking all notifications as read." };
            }
        }

        if (cleaned === "view all notifications" || cleaned === "show all notifications" || cleaned === "view all") {
            const btn = document.getElementById('notification-button');
            if (btn) {
                const viewBtn = document.getElementById('view-all-notifications-button');
                if (viewBtn) {
                    viewBtn.click();
                } else {
                    btn.click();
                    setTimeout(() => {
                        const vBtn = document.getElementById('view-all-notifications-button');
                        if (vBtn) vBtn.click();
                    }, 150);
                }
                return { success: true, reply: "Opening all notifications." };
            }
        }

        if (cleaned === "open user menu" || cleaned === "open profile menu" || cleaned === "click profile" || cleaned === "profile menu") {
            const btn = document.getElementById('user-dropdown-button');
            if (btn) {
                btn.click();
                return { success: true, reply: "Opening user profile menu." };
            }
        }

        if (cleaned === "log out" || cleaned === "logout" || cleaned === "sign out") {
            const btn = document.getElementById('user-dropdown-button');
            if (btn) {
                const logoutBtn = document.getElementById('user-logout-button');
                if (logoutBtn) {
                    logoutBtn.click();
                } else {
                    btn.click();
                    setTimeout(() => {
                        const lBtn = document.getElementById('user-logout-button');
                        if (lBtn) lBtn.click();
                    }, 150);
                }
                return { success: true, reply: "Logging out of the portal." };
            }
        }


        // ----- Settings Page Commands -----
        if (cleaned === "update password" || cleaned === "change password" || cleaned === "save password") {
            setActivePage("settings");
            setTimeout(() => {
                const btn = document.getElementById('update-password-button');
                if (btn) btn.click();
            }, 350);
            return { success: true, reply: "Updating account password." };
        }

        const resetPwdMatch = cleaned.match(/^(?:reset\s+password\s+for|reset\s+password\s+of|reset\s+pwd\s+for)\s+(.+)$/i);
        if (resetPwdMatch) {
            const email = resetPwdMatch[1].trim();
            setActivePage("settings");
            setTimeout(() => {
                const row = findUserRow(email);
                if (row) {
                    const btn = findButtonByText(row, ['Reset Password', 'Reset pwd', 'Reset']);
                    if (btn) btn.click();
                }
            }, 350);
            return { success: true, reply: `Resetting password for user "${email}".` };
        }

        const deleteUserMatch = cleaned.match(/^(?:delete\s+user|remove\s+user|delete)\s+(.+)$/i);
        if (deleteUserMatch) {
            const email = deleteUserMatch[1].trim();
            setActivePage("settings");
            setTimeout(() => {
                const row = findUserRow(email);
                if (row) {
                    const btn = findButtonByText(row, ['Delete', 'Remove']);
                    if (btn) btn.click();
                }
            }, 350);
            return { success: true, reply: `Deleting user "${email}".` };
        }


        // ----- Members Page Commands -----
        const memberSearchMatch = cleaned.match(/^(?:search\s+members\s+for|search\s+member\s+states\s+for|search\s+members)\s+(.+)$/i);
        if (memberSearchMatch) {
            const query = memberSearchMatch[1].replace(/^["']|["']$/g, '').trim();
            setActivePage("members");
            setTimeout(() => {
                const input = document.getElementById('member-search');
                if (input) {
                    setReactInputValue(input, query);
                }
            }, 350);
            return { success: true, reply: `Searching member states for "${query}".` };
        }

        const memberRegionMatch = cleaned.match(/^(?:filter\s+members\s+by|set\s+member\s+region\s+to|select\s+region|filter\s+region)\s+(.+)$/i);
        if (memberRegionMatch) {
            const region = memberRegionMatch[1].replace(/^["']|["']$/g, '').trim();
            setActivePage("members");
            setTimeout(() => {
                const select = document.getElementById('member-region');
                if (select) {
                    setReactInputValue(select, region);
                }
            }, 350);
            return { success: true, reply: `Filtering member states by region "${region}".` };
        }


        // ----- Ask Compliance Page Commands -----
        if (cleaned === "new chat" || cleaned === "start a new chat" || cleaned === "clear chat") {
            setActivePage("ask");
            setTimeout(() => {
                const newChatBtn = document.getElementById('new-chat-button');
                if (newChatBtn) newChatBtn.click();
            }, 350);
            return { success: true, reply: "Starting a new chat." };
        }

        if (cleaned === "send" || cleaned === "send message" || cleaned === "send query" || cleaned === "submit query") {
            const sendBtn = document.getElementById('send-query-button');
            if (sendBtn) {
                sendBtn.click();
                return { success: true, reply: "Sending query." };
            }
        }

        const askMatch = cleaned.match(/^(?:ask\s+compliance|ask\s+assistant|ask|query)\s+(.+)$/i);
        if (askMatch) {
            const question = askMatch[1].trim();
            setActivePage("ask");
            setTimeout(() => {
                const input = document.getElementById('compliance-query');
                if (input) {
                    setReactInputValue(input, question);
                    console.log("✅ Wrote to prompt:", question);
                    setTimeout(() => {
                        const sendBtn = document.getElementById('send-query-button');
                        if (sendBtn) sendBtn.click();
                    }, 400);
                }
            }, 350);
            return { success: true, reply: `Asking: "${question}".` };
        }

        const writePromptMatch = cleaned.match(/^(?:write|type|set)\s+(.+)\s+(?:in|into|to)\s+(?:prompt|query|input)$/i);
        if (writePromptMatch) {
            const val = writePromptMatch[1].replace(/^["']|["']$/g, '').trim();
            setActivePage("ask");
            setTimeout(() => {
                const input = document.getElementById('compliance-query');
                if (input) {
                    setReactInputValue(input, val);
                    console.log("✅ Wrote to prompt:", val);
                }
            }, 350);
            return { success: true, reply: `Writing "${val}" in prompt area.` };
        }

        // ----- Sort Table -----
        const sortMatch = cleaned.match(/(?:sort\s+by|sort\s+column|sort)\s+(.+)$/i);
        if (sortMatch) {
            const colName = sortMatch[1].trim();
            const headers = Array.from(document.querySelectorAll('th'));
            const header = headers.find(h => (h.textContent || '').toLowerCase().includes(colName));
            if (header) {
                header.click();
                return { success: true, reply: `Sorting table by ${header.textContent}.` };
            }
        }

        // ----- Pagination -----
        if (cleaned.includes("next page") || cleaned.includes("go to next") || cleaned === "next") {
            const nextBtn = findButtonByText(null, ['Next', 'Next page', '>', '→']);
            if (nextBtn) {
                nextBtn.click();
                return { success: true, reply: "Navigating to next page." };
            }
        }
        if (cleaned.includes("previous page") || cleaned.includes("prev page") || cleaned.includes("go to prev") || cleaned === "previous" || cleaned === "prev") {
            const prevBtn = findButtonByText(null, ['Previous', 'Prev', '<', '←']);
            if (prevBtn) {
                prevBtn.click();
                return { success: true, reply: "Navigating to previous page." };
            }
        }

        // ----- Check/Uncheck -----
        const checkMatch = cleaned.match(/^(check|uncheck|toggle)\s+(.+)$/i);
        if (checkMatch) {
            const action = checkMatch[1];
            const target = checkMatch[2].trim();
            const res = fillFormInput(target, action === 'check' || action === 'toggle');
            if (res) {
                return { success: true, reply: `${action === 'check' ? 'Checked' : 'Unchecked'} "${target}".` };
            }
        }

        // ----- Select option in dropdown -----
        const selectMatch = cleaned.match(/^(?:select|choose)\s+(.+)\s+(?:in|from)\s+(.+)$/i);
        if (selectMatch) {
            const optionVal = selectMatch[1].trim();
            const fieldName = selectMatch[2].trim();
            const res = fillFormInput(fieldName, optionVal);
            if (res) {
                return { success: true, reply: `Selected "${optionVal}" in "${fieldName}".` };
            }
        }

        // ----- Fill text input (set/fill) -----
        const fillMatch = cleaned.match(/^(?:set|fill|add|type)\s+(.+)\s+(?:to|with|as)\s+(.+)$/i);
        if (fillMatch) {
            const fieldName = fillMatch[1].replace(/^(?:the\s+field\s+|the\s+)/i, '').trim();
            const val = fillMatch[2].replace(/^["']|["']$/g, '').trim();
            const res = fillFormInput(fieldName, val);
            if (res) {
                return { success: true, reply: `Filled ${fieldName} with "${val}".` };
            }
        }

        const filterMatch = cleaned.match(/^(?:filter)\s+(.+)\s+by\s+(.+)$/i);
        if (filterMatch) {
            const fieldName = filterMatch[1].replace(/^(?:the\s+field\s+|the\s+)/i, '').trim();
            const val = filterMatch[2].replace(/^["']|["']$/g, '').trim();
            const res = fillFormInput(fieldName, val);
            if (res) {
                return { success: true, reply: `Filtering ${fieldName} by "${val}".` };
            }
        }


        const changeMatch = cleaned.match(/^(?:change)\s+(?:the\s+)?(.+)\s+to\s+(.+)$/i);
        if (changeMatch) {
            const fieldName = changeMatch[1].trim();
            const val = changeMatch[2].trim();
            const res = fillFormInput(fieldName, val);
            if (res) {
                return { success: true, reply: `Changed ${fieldName} to "${val}".` };
            }
        }

        // ----- Click button -----
        const clickMatch = cleaned.match(/^(?:click|press|tap)\s+(.+)$/i);
        if (clickMatch) {
            const target = clickMatch[1].replace(/^(?:the\s+button\s+|the\s+)/i, '').trim();
            const res = clickElementByText(target);
            if (res.success) {
                return { success: true, reply: `Clicked "${res.label}".` };
            }
        }

        // ----- Direct button text click -----
        const directClickRes = clickElementByText(cleaned);
        if (directClickRes.success) {
            return { success: true, reply: `Clicked "${directClickRes.label}".` };
        }

        // ============================================================
        // FIXED: Generic openers (NOW EXTRACTS AND FILLS DATA)
        // ============================================================

        // ----- Template Card Actions -----
        const templateCardUseMatch = cleaned.match(/^(?:use\s+template)\s+(.+)$/i);
        if (templateCardUseMatch) {
            const title = templateCardUseMatch[1].trim();
            setActivePage("templates");
            setTimeout(() => {
                const card = findTemplateCard(title);
                if (card) {
                    const btn = findButtonByText(card, ['Use']);
                    if (btn) btn.click();
                }
            }, 350);
            return { success: true, reply: `Using template "${title}".` };
        }

        const templateCardViewMatch = cleaned.match(/^(?:view\s+template)\s+(.+)$/i);
        if (templateCardViewMatch) {
            const title = templateCardViewMatch[1].trim();
            setActivePage("templates");
            setTimeout(() => {
                const card = findTemplateCard(title);
                if (card) {
                    const btn = findButtonByText(card, ['View']);
                    if (btn) btn.click();
                }
            }, 350);
            return { success: true, reply: `Viewing template "${title}".` };
        }

        const templateCardDeleteMatch = cleaned.match(/^(?:delete\s+template)\s+(.+)$/i);
        if (templateCardDeleteMatch) {
            const title = templateCardDeleteMatch[1].trim();
            setActivePage("templates");
            setTimeout(() => {
                const card = findTemplateCard(title);
                if (card) {
                    const btn = findButtonByText(card, ['Delete']);
                    if (btn) btn.click();
                }
            }, 350);
            return { success: true, reply: `Deleting template "${title}".` };
        }

        const templateCardExportMatch = cleaned.match(/^(?:export\s+template)\s+(.+?)(?:\s+as\s+(docx|pdf))?$/i);
        if (templateCardExportMatch) {
            const title = templateCardExportMatch[1].trim();
            const format = (templateCardExportMatch[2] || 'docx').toUpperCase();
            setActivePage("templates");
            setTimeout(() => {
                const card = findTemplateCard(title);
                if (card) {
                    const select = card.querySelector('select[aria-label="export template"]');
                    if (select) {
                        setReactSelectValue(select, format);
                    }
                }
            }, 350);
            return { success: true, reply: `Exporting template "${title}" as ${format}.` };
        }

        // ----- Create Template -----
        if (cleaned.includes("template") && (cleaned.includes("create") || cleaned.includes("new") || cleaned.includes("add") || cleaned.includes("make"))) {
            setActivePage("templates");
            const title = extractTitle(cleaned);
            setTimeout(() => {
                const addBtn = findButtonByText(null, ['New template', 'Add template']);
                if (addBtn) addBtn.click();
                if (title) {
                    fillTemplatesForm({ title, description: '', type: 'Policy', category: 'Standard' });
                }
            }, 350);
            return { success: true, reply: title ? `Creating template "${title}".` : "Opening the template creation form." };
        }

        // ----- Add User -----
        if (cleaned.includes("user") && (cleaned.includes("add") || cleaned.includes("create") || cleaned.includes("new") || cleaned.includes("register"))) {
            setActivePage("settings");
            const email = extractEmail(cleaned);
            setTimeout(() => {
                const addBtn = findButtonByText(null, ['New user', 'Add user']);
                if (addBtn) addBtn.click();
                if (email) {
                    fillSettingsForm({ action: 'add_user', userEmail: email, userRole: 'OIC User' });
                }
            }, 350);
            return { success: true, reply: email ? `Adding user "${email}".` : "Opening add user dialog." };
        }

        // ----- Add Source / KB -----
        if ((cleaned.includes("source") || cleaned.includes("kb")) && (cleaned.includes("add") || cleaned.includes("new") || cleaned.includes("ingest") || cleaned.includes("upload"))) {
            setActivePage("kb");
            const sourceName = extractSourceName(cleaned) || extractTitle(cleaned);
            setTimeout(() => {
                const addBtn = findButtonByText(null, ['Add source', 'New source', 'Ingest']);
                if (addBtn) addBtn.click();
                if (sourceName) {
                    fillKnowledgeBaseForm({ sourceName, sourceType: 'file', sourceUrl: '' });
                }
            }, 350);
            return { success: true, reply: sourceName ? `Adding source "${sourceName}".` : "Opening add knowledge source dialog." };
        }

        // ----- Monitor Site -----
        if ((cleaned.includes("site") || cleaned.includes("monitor")) && (cleaned.includes("add") || cleaned.includes("new") || cleaned.includes("track"))) {
            setActivePage("monitoring");
            const siteName = extractSiteName(cleaned) || extractTitle(cleaned);
            setTimeout(() => {
                const addBtn = findButtonByText(null, ['Add site', 'New site', 'Monitor site']);
                if (addBtn) addBtn.click();
                if (siteName) {
                    fillMonitoringForm({ siteName, siteUrl: '' });
                }
            }, 350);
            return { success: true, reply: siteName ? `Adding monitoring site "${siteName}".` : "Opening monitor site registration dialog." };
        }

        // ----- Write Document -----
        if (cleaned.includes("write") || cleaned.includes("draft") || cleaned.includes("generate") || cleaned.includes("create document") || cleaned.includes("create policy")) {
            setActivePage("aiwriter");
            const title = extractTitle(cleaned);
            const docType = extractDocType(cleaned);
            setTimeout(() => {
                if (title) {
                    fillAIWriterForm({ title, docType: docType || 'Policy', quickInstructions: `Create a ${docType || 'Policy'} document titled "${title}".` });
                }
            }, 350);
            return { success: true, reply: title ? `Creating document "${title}".` : "Opening AI Writer." };
        }

        // ----- Audit Document -----
        if (cleaned.includes("audit") && cleaned.includes("document")) {
            const title = extractTitle(cleaned);
            if (title) {
                setActivePage("auditor");
                setTimeout(() => {
                    fillAuditorForm({ docTitle: title, searchQuery: title });
                }, 350);
                return { success: true, reply: `Auditing document "${title}".` };
            }
        }

        // ----- Fallback page navigation -----
        for (const mapping of pageMappings) {
            if (mapping.keywords.some(kw => cleaned.includes(kw))) {
                setActivePage(mapping.id);
                return { success: true, reply: `Navigating to ${mapping.name} page.` };
            }
        }

        return { success: false, reply: "I couldn't match a dashboard action for that command." };
    };

    // ============================================================
    // HANDLE VOICE COMMAND (with OpenRouter)
    // ============================================================

    const handleVoiceCommand = async (text) => {
        setStatus("Analyzing...");

        // Try local parsing first
        const localResult = runLocalParser(text);
        if (localResult.success) {
            setResponse(localResult.reply);
            speak(localResult.reply);
            setStatus("Ready");
            return;
        }

        // Try OpenRouter for complex commands
        try {
            const apiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                    "HTTP-Referer": window.location.origin,
                    "X-Title": "OIC Voice Assistant"
                },
                body: JSON.stringify({
                    model: OPENROUTER_MODEL,
                    messages: [
                        {
                            role: "system",
                            content: `You are the voice assistant. Extract data from the user's command.

Return JSON with:
- action: "create_template", "write_document", "add_user", "add_source", "monitor_site", "audit", "search", "navigate", "close"
- title: The main name
- docType: "Policy", "Procedure", "Form", "Checklist", "SOP"
- email: Email address
- role: "OIC Admin", "OIC User", "External Auditor"
- sourceName: Name of the knowledge source
- sourceUrl: URL if adding a web source
- siteName: Name of the monitoring site
- query: Search query
- targetPage: Page to navigate to`
                        },
                        { role: "user", content: text }
                    ],
                    response_format: { type: "json_object" }
                })
            });

            if (!apiResponse.ok) throw new Error(`HTTP ${apiResponse.status}`);

            const resData = await apiResponse.json();
            const result = JSON.parse(resData.choices[0].message.content);
            console.log("🤖 AI Response:", result);

            // Execute based on AI response
            if (result.action === "create_template" && result.title) {
                if (activePage === "templates" || isModalOpen()) {
                    setTimeout(() => fillTemplatesForm({
                        title: result.title,
                        description: result.description || '',
                        type: result.docType || 'Policy',
                        category: 'Standard'
                    }), 300);
                } else {
                    setActivePage("templates");
                    setTimeout(() => fillTemplatesForm({
                        title: result.title,
                        description: result.description || '',
                        type: result.docType || 'Policy',
                        category: 'Standard'
                    }), 400);
                }
                setResponse(`Creating template "${result.title}".`);
                speak(`Creating template "${result.title}".`);
            }
            else if (result.action === "write_document" && result.title) {
                if (activePage === "aiwriter") {
                    setTimeout(() => fillAIWriterForm({
                        title: result.title,
                        docType: result.docType || 'Policy',
                        quickInstructions: `Create a ${result.docType || 'Policy'} document titled "${result.title}".`
                    }), 300);
                } else {
                    setActivePage("aiwriter");
                    setTimeout(() => fillAIWriterForm({
                        title: result.title,
                        docType: result.docType || 'Policy',
                        quickInstructions: `Create a ${result.docType || 'Policy'} document titled "${result.title}".`
                    }), 400);
                }
                setResponse(`Creating document "${result.title}".`);
                speak(`Creating document "${result.title}".`);
            }
            else if (result.action === "add_user" && result.email) {
                if (activePage === "settings" || isModalOpen()) {
                    setTimeout(() => fillSettingsForm({
                        action: 'add_user',
                        userEmail: result.email,
                        userRole: result.role || 'OIC User'
                    }), 300);
                } else {
                    setActivePage("settings");
                    setTimeout(() => fillSettingsForm({
                        action: 'add_user',
                        userEmail: result.email,
                        userRole: result.role || 'OIC User'
                    }), 400);
                }
                setResponse(`Adding user ${result.email}.`);
                speak(`Adding user ${result.email}.`);
            }
            else if (result.action === "add_source" && result.sourceName) {
                if (activePage === "kb" || isModalOpen()) {
                    setTimeout(() => fillKnowledgeBaseForm({
                        sourceName: result.sourceName,
                        sourceType: result.sourceUrl ? 'url' : 'file',
                        sourceUrl: result.sourceUrl || ''
                    }), 300);
                } else {
                    setActivePage("kb");
                    setTimeout(() => fillKnowledgeBaseForm({
                        sourceName: result.sourceName,
                        sourceType: result.sourceUrl ? 'url' : 'file',
                        sourceUrl: result.sourceUrl || ''
                    }), 400);
                }
                setResponse(`Adding source "${result.sourceName}".`);
                speak(`Adding source "${result.sourceName}".`);
            }
            else if (result.action === "monitor_site" && result.siteName) {
                if (activePage === "monitoring" || isModalOpen()) {
                    setTimeout(() => fillMonitoringForm({
                        siteName: result.siteName,
                        siteUrl: result.siteUrl || ''
                    }), 300);
                } else {
                    setActivePage("monitoring");
                    setTimeout(() => fillMonitoringForm({
                        siteName: result.siteName,
                        siteUrl: result.siteUrl || ''
                    }), 400);
                }
                setResponse(`Adding monitoring site "${result.siteName}".`);
                speak(`Adding monitoring site "${result.siteName}".`);
            }
            else if (result.action === "audit" && result.title) {
                if (activePage === "auditor") {
                    setTimeout(() => fillAuditorForm({
                        docTitle: result.title,
                        searchQuery: result.title
                    }), 300);
                } else {
                    setActivePage("auditor");
                    setTimeout(() => fillAuditorForm({
                        docTitle: result.title,
                        searchQuery: result.title
                    }), 400);
                }
                setResponse(`Auditing "${result.title}".`);
                speak(`Auditing "${result.title}".`);
            }
            else if (result.action === "search" && result.query) {
                setActivePage("documents");
                setTimeout(() => {
                    const searchInput = document.querySelector('input[placeholder*="Search"], input[placeholder*="Filter"]');
                    if (searchInput) {
                        fillFormInput('search', result.query);
                    }
                }, 400);
                setResponse(`Searching for "${result.query}".`);
                speak(`Searching for "${result.query}".`);
            }
            else if (result.action === "navigate" && result.targetPage) {
                setActivePage(result.targetPage);
                setResponse(`Navigating to ${result.targetPage}.`);
                speak(`Navigating to ${result.targetPage}.`);
            }
            else if (result.action === "close") {
                closeModals();
                setResponse("Closing dialogs.");
                speak("Closing dialogs.");
            }
            else {
                setResponse(localResult.reply || "I couldn't understand that command.");
                speak(localResult.reply || "I couldn't understand that command.");
            }

            setStatus("Ready");

        } catch (err) {
            console.error("OpenRouter error:", err);
            setStatus("Ready");
            const fallback = runLocalParser(text);
            if (fallback.success) {
                setResponse(fallback.reply);
                speak(fallback.reply);
            } else {
                setResponse("I couldn't process that command. Try 'create template' or 'write document'.");
                speak("I couldn't process that command.");
            }
        }
    };

    // ============================================================
    // UI RENDER (unchanged)
    // ============================================================

    return (
        <>
            {/* Floating Orb Mic Button */}
            <button
                onClick={() => {
                    setIsOpen(!isOpen);
                    if (!isOpen) {
                        setTranscript("");
                        setResponse("");
                        setStatus(shouldListenRef.current ? "Listening..." : "Ready");
                    }
                }}
                className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${shouldListenRef.current
                        ? 'bg-red-600 animate-pulse text-white scale-110 shadow-red-500/50'
                        : 'bg-[#1a4731] hover:bg-[#153d28] text-white hover:scale-105 shadow-[#1a4731]/40'
                    }`}
                title="Toggle Voice Assistant"
            >
                {shouldListenRef.current ? (
                    <div className="relative">
                        <div className="absolute -inset-2 bg-red-400 rounded-full animate-ping opacity-75"></div>
                        <svg className="w-6 h-6 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 1118 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                        </svg>
                    </div>
                ) : (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                )}
            </button>

            {/* Assistant Panel */}
            {isOpen && (
                <div
                    className="fixed bottom-24 right-6 w-96 glass-card p-5 z-40 shadow-2xl border border-white/40 flex flex-col max-h-[500px]"
                    style={{ animation: 'slideUp 0.25s ease-out forwards' }}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-white/20 mb-3">
                        <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${shouldListenRef.current ? 'bg-red-500 animate-ping' :
                                status === 'Analyzing...' ? 'bg-amber-500 animate-pulse' : 'bg-green-500'
                                }`}></div>
                            <span className="font-semibold text-gray-900 text-sm">Voice Assistant</span>
                            <span className="text-xs text-gray-700">({status})</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setShowSettings(!showSettings)} className="p-1 hover:bg-white/20 rounded transition-colors text-gray-700">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </button>
                            <button onClick={closeVoiceAssistant} className="p-1 hover:bg-white/20 rounded transition-colors text-gray-700">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {showSettings ? (
                        <div className="space-y-3 py-2 text-sm text-gray-700">
                            <div className="text-xs text-gray-700 mb-2">
                                Voice command execution handles active workspace state. Wake word is <span className="font-semibold text-gray-900">"Abdul"</span>.
                            </div>
                            <div className="flex items-center justify-between pt-1">
                                <span className="text-xs text-gray-600 font-medium">Text-To-Speech Feedback</span>
                                <button onClick={() => {
                                    const newVal = !isTtsEnabled;
                                    setIsTtsEnabled(newVal);
                                    localStorage.setItem('voice_tts_enabled', newVal.toString());
                                }} className={`px-3 py-1 rounded text-xs font-medium ${isTtsEnabled ? 'bg-[#1a4731] text-white' : 'bg-gray-200 text-gray-700'}`}>
                                    {isTtsEnabled ? "Enabled" : "Disabled"}
                                </button>
                            </div>
                            <button onClick={() => setShowSettings(false)} className="w-full mt-4 py-1.5 bg-[#1a4731] text-white rounded-md text-xs font-medium hover:bg-[#153d28]">
                                Back to Assistant
                            </button>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col space-y-4 overflow-y-auto pr-1">
                            {shouldListenRef.current && (
                                <div className="text-center bg-[#1a4731]/10 text-[#1a4731] text-xs py-1.5 px-3 rounded-lg border border-[#1a4731]/15 font-medium animate-pulse">
                                    🎤 Mic is continuous. Say "Abdul" before commands!
                                </div>
                            )}

                            {shouldListenRef.current && (
                                <div className="flex items-center justify-center gap-1.5 py-2 h-10">
                                    <span className="w-1.5 h-4 bg-[#1a4731] rounded animate-bounce [animation-delay:-0.3s]"></span>
                                    <span className="w-1.5 h-8 bg-[#1a4731] rounded animate-bounce [animation-delay:-0.15s]"></span>
                                    <span className="w-1.5 h-6 bg-[#1a4731] rounded animate-bounce"></span>
                                    <span className="w-1.5 h-9 bg-[#1a4731] rounded animate-bounce [animation-delay:-0.4s]"></span>
                                    <span className="w-1.5 h-3 bg-[#1a4731] rounded animate-bounce [animation-delay:-0.2s]"></span>
                                </div>
                            )}

                            {transcript && (
                                <div className="space-y-1">
                                    <span className="text-xs text-gray-700 font-semibold uppercase tracking-wider block">You said</span>
                                    <div className="p-3 bg-white/40 rounded-xl text-sm text-gray-900 border border-white/20 italic">
                                        "{transcript}"
                                    </div>
                                </div>
                            )}

                            {response && (
                                <div className="space-y-1">
                                    <span className="text-xs text-gray-700 font-semibold uppercase tracking-wider block">Assistant reply</span>
                                    <div className="p-3 bg-[#1a4731]/10 rounded-xl text-sm text-[#1a4731] border border-[#1a4731]/20 font-medium">
                                        {response}
                                    </div>
                                </div>
                            )}

                            {!transcript && !response && (
                                <div className="space-y-3 py-2">
                                    <div className="text-sm font-medium text-gray-800">I can fill forms, navigate, and close anything!</div>
                                    <div className="space-y-2">
                                        <div className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Try saying:</div>
                                        <button onClick={() => handleVoiceCommand("create template Code of Conduct")} className="w-full text-left p-2 hover:bg-white/30 rounded-lg text-xs text-gray-700 transition-colors border border-dashed border-white/40">
                                            👉 "Abdul, create template Code of Conduct"
                                        </button>
                                        <button onClick={() => handleVoiceCommand("write a policy called Student Attendance")} className="w-full text-left p-2 hover:bg-white/30 rounded-lg text-xs text-gray-700 transition-colors border border-dashed border-white/40">
                                            👉 "Abdul, write a policy called Student Attendance"
                                        </button>
                                        <button onClick={() => handleVoiceCommand("add user test@oic.org as admin")} className="w-full text-left p-2 hover:bg-white/30 rounded-lg text-xs text-gray-700 transition-colors border border-dashed border-white/40">
                                            👉 "Abdul, add user test@oic.org as admin"
                                        </button>
                                        <button onClick={() => handleVoiceCommand("close all")} className="w-full text-left p-2 hover:bg-white/30 rounded-lg text-xs text-gray-700 transition-colors border border-dashed border-white/40">
                                            👉 "Abdul, close all"
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center justify-between pt-3 border-t border-white/20 mt-auto">
                                <button onClick={toggleListening} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${shouldListenRef.current ? 'bg-red-500 text-white animate-pulse shadow-md' : 'bg-white/50 text-gray-700 hover:bg-white/80 border border-gray-300'}`}>
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={shouldListenRef.current ? "M21 12a9 9 0 11-18 0 9 9 0 1118 0z M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" : "M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"} />
                                    </svg>
                                    {shouldListenRef.current ? "Stop Voice" : "Start Voice"}
                                </button>
                                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                                    <input type="checkbox" checked={isTtsEnabled} onChange={() => {
                                        const newVal = !isTtsEnabled;
                                        setIsTtsEnabled(newVal);
                                        localStorage.setItem('voice_tts_enabled', newVal.toString());
                                    }} className="rounded text-[#1a4731] focus:ring-[#1a4731] border-gray-300 w-3 h-3" />
                                    <span className="text-[11px] text-gray-700 font-medium">Read aloud</span>
                                </label>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <style>{`
                @keyframes slideUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>
        </>
    );
};