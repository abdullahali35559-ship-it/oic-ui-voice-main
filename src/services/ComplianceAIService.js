// src/services/ComplianceAIService.js

// Import all JSON files from the provided folder at compile time
const jsonFiles = import.meta.glob('../../json/json/*.json', { eager: true });

// Process and store the JSON data in a more searchable format
let knowledgeBase = [];

Object.entries(jsonFiles).forEach(([path, module]) => {
    // Vite's eager import puts the JSON content in the default export or directly in the module
    const data = module.default || module;
    knowledgeBase.push({
        path,
        data,
        // Create a massive string representation for simple keyword searching
        searchableText: JSON.stringify(data).toLowerCase()
    });
});

/**
 * Generates a professional AI response based on the JSON knowledge base.
 * @param {string} query The user's question
 * @returns {string} The AI's response
 */
export const generateAIResponse = (query) => {
    const q = query.toLowerCase().trim();

    // 1. Extract keywords from the query
    const stopWords = ['what', 'is', 'the', 'of', 'in', 'and', 'to', 'a', 'for', 'on', 'can', 'who', 'how', 'when', 'does', 'do', 'are', 'if', 'we', 'our', 'be', 'an'];
    const keywords = q.replace(/[^\w\s]/gi, '').split(/\s+/).filter(word => !stopWords.includes(word) && word.length > 2);

    if (keywords.length === 0) {
        return "Please ask a specific question regarding OIC compliance, rules, or procedures, and I will check the official documents for you.";
    }

    // 2. Try to find a direct match in the pre-written QA examples inside the JSONs
    let bestQAMatch = null;
    let highestQAScore = 0;

    // Helper to recursively find QA arrays in the JSON
    const searchForQA = (obj) => {
        if (!obj || typeof obj !== 'object') return;
        
        // If we found an array that looks like QA examples
        if (Array.isArray(obj)) {
            obj.forEach(item => {
                if (item && item.user_question) {
                    let score = 0;
                    const questionLower = item.user_question.toLowerCase();
                    // Exact match gets highest priority
                    if (questionLower === q) score += 100;
                    
                    // Keyword match
                    keywords.forEach(kw => {
                        if (questionLower.includes(kw)) score += 5;
                    });
                    
                    if (score > highestQAScore) {
                        highestQAScore = score;
                        bestQAMatch = item;
                    }
                }
            });
        }

        // Keep searching deeper
        Object.values(obj).forEach(val => searchForQA(val));
    };

    knowledgeBase.forEach(doc => searchForQA(doc.data));

    // If we found a good QA match, return its human-like answer
    if (bestQAMatch && highestQAScore > 5) {
        let answer = "";
        
        if (bestQAMatch.assistant_answer && bestQAMatch.assistant_answer.answer) {
            answer = bestQAMatch.assistant_answer.answer;
        } else if (bestQAMatch.assistant_response && bestQAMatch.assistant_response.answer) {
            answer = bestQAMatch.assistant_response.answer;
        } else if (bestQAMatch.messages && bestQAMatch.messages.length > 1) {
            answer = bestQAMatch.messages[1].content;
        }

        if (answer) {
            return answer;
        }
    }

    // 3. Fallback: Search the JSON for a descriptive text block that matches keywords
    let bestTextMatch = "";
    let highestTextScore = 0;
    let matchedDocTitle = "OIC Official Document";

    knowledgeBase.forEach(doc => {
        let docTitle = doc.data?.document?.title || "OIC Official Document";
        
        const searchForText = (obj) => {
            if (!obj) return;
            if (typeof obj === 'string') {
                let score = 0;
                const textLower = obj.toLowerCase();
                keywords.forEach(kw => {
                    if (textLower.includes(kw)) score += 2;
                });
                
                // Only consider strings that are descriptive (sentences)
                if (score > highestTextScore && obj.length > 30 && !obj.includes('_')) {
                    highestTextScore = score;
                    bestTextMatch = obj;
                    matchedDocTitle = docTitle;
                }
            } else if (typeof obj === 'object') {
                Object.values(obj).forEach(val => searchForText(val));
            }
        };

        searchForText(doc.data);
    });

    // 4. Return plain, professional text without markdown symbols
    if (bestTextMatch && highestTextScore > 0) {
        return `Based on the ${matchedDocTitle}, here is the relevant information: ${bestTextMatch}. For more details, please refer to the official document.`;
    }

    return "I could not find a direct answer to your question in the loaded OIC compliance documents. Could you please rephrase or provide more specific keywords?";
};
