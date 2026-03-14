// ============================================================
//  Fertig — RAG Chat Frontend
//  Communicates with /api/rag, shows retrieved source citations.
// ============================================================

const sidebar         = document.getElementById('sidebar');
const sidebarToggle   = document.getElementById('sidebarToggle');
const sidebarOverlay  = document.getElementById('sidebarOverlay');
const newChatBtn      = document.getElementById('newChatBtn');
const messagesContainer = document.getElementById('messagesContainer');
const messages        = document.getElementById('messages');
const welcomeMessage  = document.getElementById('welcomeMessage');
const messageInput    = document.getElementById('messageInput');
const sendBtn         = document.getElementById('sendBtn');
const chatHistory     = document.getElementById('chatHistory');
const yearFilter      = document.getElementById('yearFilter');
const subjectFilter   = document.getElementById('subjectFilter');
const kbChunkCount    = document.getElementById('kbChunkCount');
const ragStatusBadge  = document.getElementById('ragStatusBadge');

let conversationHistory = [];
let isProcessing = false;

// ── init ──────────────────────────────────────────────────────
function init() {
    loadUserProfile();
    loadKbStats();
    setupEventListeners();
    adjustTextareaHeight();
    updateSendButton();
}

// ── user profile ──────────────────────────────────────────────
function loadUserProfile() {
    if (typeof getCurrentUser !== 'function') return;
    const user = getCurrentUser();
    if (!user) return;
    const avatarEl = document.getElementById('userAvatar');
    const nameEl   = document.getElementById('userName');
    const emailEl  = document.getElementById('userEmail');
    if (avatarEl) avatarEl.textContent = user.name ? user.name[0].toUpperCase() : 'U';
    if (nameEl)   nameEl.textContent   = user.name  || 'User';
    if (emailEl)  emailEl.textContent  = user.email || '';
}

// ── knowledge base stats & subject list ───────────────────────
async function loadKbStats() {
    try {
        const res  = await fetch('/api/rag/stats');
        const data = await res.json();

        if (kbChunkCount) {
            kbChunkCount.textContent =
                `📚 ${data.totalChunks} chunk${data.totalChunks !== 1 ? 's' : ''} loaded`;
        }

        if (subjectFilter && Array.isArray(data.subjects)) {
            data.subjects.forEach(subject => {
                const opt = document.createElement('option');
                opt.value = subject;
                opt.textContent = subject;
                subjectFilter.appendChild(opt);
            });
        }
    } catch {
        if (kbChunkCount) kbChunkCount.textContent = '⚠ KB unavailable';
    }
}

// ── event listeners ──────────────────────────────────────────
function setupEventListeners() {
    if (sidebarToggle) sidebarToggle.addEventListener('click', toggleSidebar);
    if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeSidebar);

    newChatBtn.addEventListener('click', startNewChat);
    sendBtn.addEventListener('click', handleSendMessage);
    messageInput.addEventListener('keydown', handleKeyPress);
    messageInput.addEventListener('input', handleInput);

    document.querySelectorAll('.suggestion-card').forEach(card => {
        card.addEventListener('click', () => {
            const prompt = card.getAttribute('data-prompt');
            if (prompt) {
                messageInput.value = prompt;
                adjustTextareaHeight();
                updateSendButton();
                handleSendMessage();
            }
        });
    });

    window.addEventListener('resize', handleResize);
}

function toggleSidebar() {
    sidebar.classList.toggle('active');
    sidebarOverlay.classList.toggle('active');
}
function closeSidebar() {
    sidebar.classList.remove('active');
    sidebarOverlay.classList.remove('active');
}
function handleResize() {
    if (window.innerWidth > 768) closeSidebar();
}

// ── new chat ─────────────────────────────────────────────────
function startNewChat() {
    conversationHistory = [];
    messages.innerHTML  = '';
    welcomeMessage.style.display = 'block';
    messageInput.value = '';
    adjustTextareaHeight();
    updateSendButton();
    setRagStatus('ready');

    document.querySelectorAll('.history-item').forEach(i => i.classList.remove('active'));
    addHistoryItem('New Conversation');

    if (window.innerWidth <= 768) closeSidebar();
}

function addHistoryItem(title) {
    const todaySection = chatHistory.querySelector('.history-section');
    if (!todaySection) return;

    document.querySelectorAll('.history-item').forEach(i => i.classList.remove('active'));

    const item = document.createElement('div');
    item.className = 'history-item active';
    item.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        <span>${title}</span>`;

    const h3 = todaySection.querySelector('h3');
    if (h3 && h3.nextElementSibling) {
        todaySection.insertBefore(item, h3.nextElementSibling);
    } else if (h3) {
        h3.insertAdjacentElement('afterend', item);
    }
}

// ── input helpers ─────────────────────────────────────────────
function handleInput() {
    adjustTextareaHeight();
    updateSendButton();
}
function adjustTextareaHeight() {
    messageInput.style.height = 'auto';
    messageInput.style.height = Math.min(messageInput.scrollHeight, 200) + 'px';
}
function updateSendButton() {
    sendBtn.disabled = messageInput.value.trim().length === 0 || isProcessing;
}
function handleKeyPress(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (!sendBtn.disabled) handleSendMessage();
    }
}

// ── send message ─────────────────────────────────────────────
async function handleSendMessage() {
    const userMessage = messageInput.value.trim();
    if (!userMessage || isProcessing) return;

    isProcessing = true;
    welcomeMessage.style.display = 'none';

    addMessage(userMessage, 'user');
    messageInput.value = '';
    adjustTextareaHeight();
    updateSendButton();

    showTypingIndicator();
    setRagStatus('searching');

    const { reply, sources, ragUsed, error } = await callRagApi(userMessage);

    hideTypingIndicator();

    if (error) {
        addMessage('⚠ ' + error, 'bot', [], false);
        setRagStatus('ready');
    } else {
        addMessage(reply, 'bot', sources || [], ragUsed);
        setRagStatus(ragUsed ? 'used' : 'general');
    }

    conversationHistory.push(
        { role: 'user',      content: userMessage },
        { role: 'assistant', content: reply || '' }
    );

    if (conversationHistory.length === 2) {
        updateChatTitle(userMessage);
    }

    isProcessing = false;
    updateSendButton();
    messageInput.focus();
}

// ── RAG API call ─────────────────────────────────────────────
async function callRagApi(message) {
    const subject = subjectFilter ? subjectFilter.value : 'all';
    const year    = yearFilter    ? yearFilter.value    : 'all';

    try {
        const res  = await fetch('/api/rag', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ message, subject, year })
        });
        return await res.json();
    } catch (err) {
        console.error('[RAG]', err);
        return { error: 'Could not reach the study assistant server.' };
    }
}

// ── message rendering ─────────────────────────────────────────
function addMessage(text, sender, sources = [], ragUsed = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = sender === 'user' ? '👤' : '🎓';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';

    const textDiv = document.createElement('div');
    textDiv.className = 'message-text';
    textDiv.textContent = text;
    contentDiv.appendChild(textDiv);

    if (sender === 'bot') {
        // Source citations
        if (sources && sources.length > 0) {
            const sourcesDiv = document.createElement('div');
            sourcesDiv.className = 'message-sources';
            sourcesDiv.innerHTML = `
                <div class="sources-label">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                        <path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
                    </svg>
                    Sources from study materials
                </div>
                ${sources.map((s, i) => `
                    <div class="source-item">
                        <span class="source-num">[${i + 1}]</span>
                        <span>
                            <span class="source-title">${escapeHtml(s.title)}</span>
                            <span class="source-meta"> — ${escapeHtml(s.subject)}, ${escapeHtml(s.chapter)} · ${escapeHtml(s.source)}</span>
                        </span>
                    </div>`).join('')}
            `;
            contentDiv.appendChild(sourcesDiv);
        } else {
            // Show a note that no study material context was used
            const notice = document.createElement('div');
            notice.className = 'no-context-notice';
            notice.innerHTML = `
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/><path d="M12 16v-4m0-4h.01"/>
                </svg>
                No study material matched — answered from general knowledge`;
            contentDiv.appendChild(notice);
        }

        // Copy / Regenerate actions
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'message-actions';
        actionsDiv.innerHTML = `
            <button class="message-action-btn" onclick="copyMessage(this)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
                Copy
            </button>
            <button class="message-action-btn" onclick="regenerateResponse(this)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="23 4 23 10 17 10"/>
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                </svg>
                Regenerate
            </button>`;
        contentDiv.appendChild(actionsDiv);
    }

    messageDiv.appendChild(avatar);
    messageDiv.appendChild(contentDiv);
    messages.appendChild(messageDiv);
    scrollToBottom();
}

function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message bot';
    typingDiv.id = 'typingIndicator';
    typingDiv.innerHTML = `
        <div class="message-avatar">🎓</div>
        <div class="message-content">
            <div class="typing-indicator">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        </div>`;
    messages.appendChild(typingDiv);
    scrollToBottom();
}

function hideTypingIndicator() {
    const el = document.getElementById('typingIndicator');
    if (el) el.remove();
}

function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// ── RAG status badge ─────────────────────────────────────────
function setRagStatus(state) {
    if (!ragStatusBadge) return;
    const states = {
        ready:     '⚡ Ready',
        searching: '🔍 Searching…',
        used:      '📚 Context used',
        general:   '💬 General answer'
    };
    ragStatusBadge.textContent = states[state] || states.ready;
}

// ── helpers ──────────────────────────────────────────────────
function updateChatTitle(firstMessage) {
    const activeSpan = document.querySelector('.history-item.active span');
    if (activeSpan) {
        activeSpan.textContent = firstMessage.length > 30
            ? firstMessage.slice(0, 30) + '…'
            : firstMessage;
    }
}

function copyMessage(button) {
    const text = button.closest('.message-content').querySelector('.message-text').textContent;
    navigator.clipboard.writeText(text).then(() => {
        const orig = button.innerHTML;
        button.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"/>
            </svg> Copied!`;
        setTimeout(() => { button.innerHTML = orig; }, 2000);
    }).catch(console.error);
}

async function regenerateResponse(button) {
    if (isProcessing) return;
    const msgEl = button.closest('.message');
    const idx   = Array.from(messages.children).indexOf(msgEl);
    if (idx <= 0) return;

    const prevText = messages.children[idx - 1].querySelector('.message-text').textContent;
    msgEl.remove();

    isProcessing = true;
    showTypingIndicator();
    setRagStatus('searching');

    const { reply, sources, ragUsed, error } = await callRagApi(prevText);
    hideTypingIndicator();

    if (error) {
        addMessage('⚠ ' + error, 'bot', [], false);
        setRagStatus('ready');
    } else {
        addMessage(reply, 'bot', sources || [], ragUsed);
        setRagStatus(ragUsed ? 'used' : 'general');
    }

    isProcessing = false;
    updateSendButton();
}

document.addEventListener('DOMContentLoaded', init);
