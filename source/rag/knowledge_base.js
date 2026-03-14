/**
 * RAG Knowledge Base
 *
 * Loads all *.json files from data/study_materials/ and exposes a
 * simple keyword-based search that scores chunks by TF-IDF-like overlap.
 *
 * When real PDFs / PPTs become available, add a separate ingestion
 * script that converts them to JSON chunks and drops the file into
 * data/study_materials/.  This module will pick them up automatically
 * on the next server restart (or on-demand reload via reloadKnowledgeBase()).
 */

const fs   = require('fs');
const path = require('path');

const MATERIALS_DIR = path.join(__dirname, '../../data/study_materials');

// In-memory store: array of chunk objects
let knowledgeBase = [];
// IDF (Inverse Document Frequency) map: term → score
let idfMap = {};

// ---------- helpers ----------

function tokenize(text) {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(t => t.length > 1);
}

function buildIDF(chunks) {
    const N = chunks.length;
    const df = {};  // document frequency per term
    chunks.forEach(chunk => {
        const terms = new Set(tokenize(chunk.content + ' ' + chunk.title));
        terms.forEach(t => { df[t] = (df[t] || 0) + 1; });
    });
    const idf = {};
    Object.keys(df).forEach(t => {
        idf[t] = Math.log((N + 1) / (df[t] + 1)) + 1;  // smoothed IDF (Laplace +1 avoids zero-division and dampens extreme values)
    });
    return idf;
}

function tfScore(tokens) {
    const tf = {};
    tokens.forEach(t => { tf[t] = (tf[t] || 0) + 1; });
    const total = tokens.length || 1;
    Object.keys(tf).forEach(t => { tf[t] /= total; });
    return tf;
}

// ---------- load ----------

function loadKnowledgeBase() {
    if (!fs.existsSync(MATERIALS_DIR)) {
        console.warn('[RAG] study_materials directory not found:', MATERIALS_DIR);
        return;
    }

    const files = fs.readdirSync(MATERIALS_DIR).filter(f => f.endsWith('.json'));
    if (files.length === 0) {
        console.warn('[RAG] No JSON files found in study_materials/');
        return;
    }

    const chunks = [];
    files.forEach(file => {
        const filePath = path.join(MATERIALS_DIR, file);
        try {
            const raw = fs.readFileSync(filePath, 'utf8');
            const data = JSON.parse(raw);
            if (Array.isArray(data)) {
                data.forEach(chunk => {
                    if (chunk.id && chunk.content && chunk.title) {
                        chunks.push(chunk);
                    }
                });
            }
        } catch (err) {
            console.error('[RAG] Failed to load', file, err.message);
        }
    });

    knowledgeBase = chunks;
    idfMap = buildIDF(chunks);
    console.log(`[RAG] Loaded ${knowledgeBase.length} chunks from ${files.length} file(s).`);
}

// ---------- search ----------

/**
 * Returns the top-K most relevant chunks for a query.
 * @param {string} query         User message
 * @param {object} [filters]     Optional { subject, year }
 * @param {number} [topK=3]      Number of chunks to return
 * @returns {{ chunk: object, score: number }[]}
 */
function search(query, filters = {}, topK = 3) {
    const queryTokens = tokenize(query);
    const queryTF = tfScore(queryTokens);

    let candidates = knowledgeBase;

    if (filters.subject) {
        const sub = filters.subject.toLowerCase();
        candidates = candidates.filter(
            c => c.subject && c.subject.toLowerCase().includes(sub)
        );
    }
    if (filters.year) {
        const yr = filters.year.toLowerCase();
        candidates = candidates.filter(
            c => c.year && c.year.toLowerCase().includes(yr)
        );
    }

    if (candidates.length === 0) return [];

    const scored = candidates.map(chunk => {
        const docTokens = tokenize(chunk.content + ' ' + chunk.title + ' ' + chunk.chapter);
        const docTF = tfScore(docTokens);

        // TF-IDF cosine similarity
        let score = 0;
        Object.keys(queryTF).forEach(term => {
            if (docTF[term]) {
                const idf = idfMap[term] || 1;
                score += queryTF[term] * docTF[term] * idf * idf;
            }
        });

        return { chunk, score };
    });

    return scored
        .filter(r => r.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, topK);
}

/**
 * Returns all unique subjects present in the knowledge base.
 */
function getSubjects() {
    const subjects = new Set(knowledgeBase.map(c => c.subject).filter(Boolean));
    return [...subjects].sort();
}

/**
 * Returns total count of loaded chunks.
 */
function getStats() {
    return {
        totalChunks: knowledgeBase.length,
        subjects: getSubjects()
    };
}

/**
 * Hot-reload the knowledge base (e.g. after new files are uploaded).
 */
function reloadKnowledgeBase() {
    knowledgeBase = [];
    idfMap = {};
    loadKnowledgeBase();
}

// Load at module import time
loadKnowledgeBase();

module.exports = { search, getSubjects, getStats, reloadKnowledgeBase };
