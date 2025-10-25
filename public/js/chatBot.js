const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebarToggle');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const newChatBtn = document.getElementById('newChatBtn');
const messagesContainer = document.getElementById('messagesContainer');
const messages = document.getElementById('messages');
const welcomeMessage = document.getElementById('welcomeMessage');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const chatHistory = document.getElementById('chatHistory');

let conversationHistory = [];
let isProcessing = false;

function init() {
    setupEventListeners();
    adjustTextareaHeight();
    updateSendButton();
}

function setupEventListeners() {
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', toggleSidebar);
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', closeSidebar);
    }

    newChatBtn.addEventListener('click', startNewChat);
    sendBtn.addEventListener('click', handleSendMessage);
    messageInput.addEventListener('keydown', handleKeyPress);
    messageInput.addEventListener('input', handleInput);

    const suggestionCards = document.querySelectorAll('.suggestion-card');
    suggestionCards.forEach(card => {
        card.addEventListener('click', () => {
            const prompt = card.getAttribute('data-prompt');
            if (prompt) {
                messageInput.value = prompt;
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
    if (window.innerWidth > 768) {
        closeSidebar();
    }
}

function startNewChat() {
    conversationHistory = [];
    messages.innerHTML = '';
    welcomeMessage.style.display = 'block';
    messageInput.value = '';
    adjustTextareaHeight();
    updateSendButton();

    const allHistoryItems = document.querySelectorAll('.history-item');
    allHistoryItems.forEach(item => item.classList.remove('active'));

    const timestamp = new Date().toLocaleString();
    addHistoryItem('New Conversation', timestamp);

    if (window.innerWidth <= 768) {
        closeSidebar();
    }
}

function addHistoryItem(title, timestamp) {
    const todaySection = chatHistory.querySelector('.history-section');
    if (!todaySection) return;

    const allHistoryItems = document.querySelectorAll('.history-item');
    allHistoryItems.forEach(item => item.classList.remove('active'));

    const historyItem = document.createElement('div');
    historyItem.className = 'history-item active';
    historyItem.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        <span>${title}</span>
    `;

    const h3 = todaySection.querySelector('h3');
    if (h3 && h3.nextElementSibling) {
        todaySection.insertBefore(historyItem, h3.nextElementSibling);
    } else if (h3) {
        h3.insertAdjacentElement('afterend', historyItem);
    }
}

function handleInput() {
    adjustTextareaHeight();
    updateSendButton();
}

function adjustTextareaHeight() {
    messageInput.style.height = 'auto';
    const newHeight = Math.min(messageInput.scrollHeight, 200);
    messageInput.style.height = newHeight + 'px';
}

function updateSendButton() {
    const hasText = messageInput.value.trim().length > 0;
    sendBtn.disabled = !hasText || isProcessing;
}

function handleKeyPress(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (!sendBtn.disabled) {
            handleSendMessage();
        }
    }
}

async function handleSendMessage() {
    const userMessage = messageInput.value.trim();
    
    if (!userMessage || isProcessing) return;
    
    isProcessing = true;
    
    if (welcomeMessage.style.display !== 'none') {
        welcomeMessage.style.display = 'none';
    }
    
    addMessage(userMessage, 'user');
    
    messageInput.value = '';
    adjustTextareaHeight();
    updateSendButton();
    
    showTypingIndicator();
    
    await delay(1500 + Math.random() * 1000);
    
    const botResponse = generateBotResponse(userMessage);
    
    hideTypingIndicator();
    
    addMessage(botResponse, 'bot');
    
    conversationHistory.push(
        { role: 'user', content: userMessage },
        { role: 'assistant', content: botResponse }
    );

    if (conversationHistory.length === 2) {
        updateChatTitle(userMessage);
    }
    
    isProcessing = false;
    updateSendButton();
    messageInput.focus();
}

function addMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = sender === 'user' ? '👤' : '🤖';
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    const textDiv = document.createElement('div');
    textDiv.className = 'message-text';
    textDiv.textContent = text;
    
    contentDiv.appendChild(textDiv);
    
    if (sender === 'bot') {
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
            </button>
        `;
        contentDiv.appendChild(actionsDiv);
    }
    
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(contentDiv);
    
    messages.appendChild(messageDiv);
    scrollToBottom();
}

function showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message bot';
    typingDiv.id = 'typingIndicator';
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = '🤖';
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    const indicator = document.createElement('div');
    indicator.className = 'typing-indicator';
    indicator.innerHTML = `
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
    `;
    
    contentDiv.appendChild(indicator);
    typingDiv.appendChild(avatar);
    typingDiv.appendChild(contentDiv);
    
    messages.appendChild(typingDiv);
    scrollToBottom();
}

function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typingIndicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

async function generateBotResponse(userMessage) {
  try {
    const res = await fetch('http://localhost:5000/api/chatbot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userMessage })
    });
    const data = await res.json();
    return data.reply || "Sorry, no response.";
  } catch (err) {
    console.error(err);
    return "Error: could not reach chatbot server.";
  }
}



function updateChatTitle(firstMessage) {
    const activeHistoryItem = document.querySelector('.history-item.active span');
    if (activeHistoryItem) {
        const title = firstMessage.length > 30 
            ? firstMessage.substring(0, 30) + '...' 
            : firstMessage;
        activeHistoryItem.textContent = title;
    }
}

function copyMessage(button) {
    const messageText = button.closest('.message-content').querySelector('.message-text').textContent;
    
    navigator.clipboard.writeText(messageText).then(() => {
        const originalHTML = button.innerHTML;
        button.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"/>
            </svg>
            Copied!
        `;
        
        setTimeout(() => {
            button.innerHTML = originalHTML;
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy:', err);
    });
}

async function regenerateResponse(button) {
    if (isProcessing) return;
    
    const messageElement = button.closest('.message');
    const messageIndex = Array.from(messages.children).indexOf(messageElement);
    
    if (messageIndex > 0) {
        const previousMessage = messages.children[messageIndex - 1];
        const userText = previousMessage.querySelector('.message-text').textContent;
        
        messageElement.remove();
        
        isProcessing = true;
        showTypingIndicator();
        
        await delay(1500 + Math.random() * 1000);
        
        const newResponse = generateBotResponse(userText);
        
        hideTypingIndicator();
        
        addMessage(newResponse, 'bot');
        
        isProcessing = false;
        updateSendButton();
    }
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

document.addEventListener('DOMContentLoaded', init);