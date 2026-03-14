const express = require('express');
const router  = express.Router();
const fetch   = require('node-fetch');
const kb      = require('../rag/knowledge_base');

const OLLAMA_URL   = process.env.OLLAMA_URL   || 'http://localhost:11434/api/generate';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'phi3:mini';
const TOP_K = 3;   // number of retrieved chunks to include in the prompt

// ── prompt templates ──────────────────────────────────────────
function buildRagPrompt(contextBlock, message) {
    return `You are an academic assistant for engineering students studying in India. Answer the student's question using the provided study material context. Be concise, accurate, and educational. If the context does not fully cover the question, supplement with general knowledge and mention it.

STUDY MATERIAL CONTEXT:
${contextBlock}

STUDENT QUESTION: ${message}

ANSWER (cite the context where relevant):`;
}

function buildGeneralPrompt(message) {
    return `You are an academic assistant for engineering students studying in India. Answer the following question accurately and educationally. If it is outside your knowledge, say so clearly.

STUDENT QUESTION: ${message}

ANSWER:`;
}

// POST /api/rag
router.post('/', async (req, res) => {
    const { message, subject, year } = req.body;

    if (!message || !message.trim()) {
        return res.status(400).json({ error: 'No message provided' });
    }

    // 1. Retrieve relevant chunks from the knowledge base
    const filters = {};
    if (subject && subject !== 'all') filters.subject = subject;
    if (year    && year    !== 'all') filters.year    = year;

    const results = kb.search(message, filters, TOP_K);

    let contextBlock = '';
    const sources = [];

    if (results.length > 0) {
        contextBlock = results
            .map((r, i) => {
                sources.push({
                    title:   r.chunk.title,
                    subject: r.chunk.subject,
                    chapter: r.chunk.chapter,
                    source:  r.chunk.source
                });
                return `[${i + 1}] ${r.chunk.title} (${r.chunk.subject} – ${r.chunk.chapter})\n${r.chunk.content}`;
            })
            .join('\n\n');
    }

    // 2. Build the augmented prompt
    const prompt = results.length > 0
        ? buildRagPrompt(contextBlock, message)
        : buildGeneralPrompt(message);

    // 3. Call the local LLM (with 30-second timeout so the API never hangs)
    try {
        const controller = new AbortController();
        const timeoutId  = setTimeout(() => controller.abort(), 30000);

        const ollamaRes = await fetch(OLLAMA_URL, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ model: OLLAMA_MODEL, prompt, stream: false }),
            signal:  controller.signal
        });
        clearTimeout(timeoutId);

        const data  = await ollamaRes.json();
        const reply = (data.response || '').trim() || 'No response from model.';

        return res.json({ reply, sources, ragUsed: results.length > 0 });

    } catch (error) {
        console.error('[RAG] LLM error:', error.message);

        // Graceful fallback: return retrieved context even without LLM
        if (results.length > 0) {
            const fallbackReply =
                'The local AI model is not reachable right now. Here is what I found in the study materials:\n\n' +
                results.map(r => `**${r.chunk.title}**\n${r.chunk.content}`).join('\n\n---\n\n');
            return res.json({ reply: fallbackReply, sources, ragUsed: true });
        }

        return res.status(500).json({ error: 'Could not reach the AI model and no relevant study material was found.' });
    }
});

// GET /api/rag/stats — returns knowledge base metadata (subjects, chunk count)
router.get('/stats', (_req, res) => {
    res.json(kb.getStats());
});

module.exports = router;
