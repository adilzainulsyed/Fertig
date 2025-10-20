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

function generateBotResponse(userMessage) {
    const lowerMessage = userMessage.toLowerCase().trim();
    
    const responses = {
        'hello': "Hello! I'm your AI assistant. How can I help you today?",
        'hi': "Hi there! What can I assist you with?",
        'hey': "Hey! How can I help you?",
        'how are you': "I'm doing great, thank you for asking! I'm here to help you with any questions or tasks you have. What would you like to discuss?",
        'what can you do': "I can help you with a wide range of tasks including:\n\n• Answering questions and explaining concepts\n• Writing and editing content\n• Brainstorming ideas\n• Coding and debugging\n• Analysis and problem-solving\n• Creative projects\n• And much more!\n\nWhat would you like help with?",
        'help': "I'm here to help! You can ask me about:\n\n• General knowledge and explanations\n• Writing assistance\n• Creative brainstorming\n• Code development\n• Problem-solving\n• Research and analysis\n\nJust type your question or request, and I'll do my best to assist you!",
        'thanks': "You're welcome! Is there anything else I can help you with?",
        'thank you': "You're very welcome! Feel free to ask if you need anything else.",
        'bye': "Goodbye! It was great chatting with you. Feel free to come back anytime!",
        'goodbye': "Goodbye! Have a wonderful day! Come back anytime you need assistance.",
    };
    
    for (const [key, response] of Object.entries(responses)) {
        if (lowerMessage.includes(key)) {
            return response;
        }
    }
    
    if (lowerMessage.includes('quantum computing')) {
        return "Quantum computing is a fascinating field! It uses quantum mechanics principles like superposition and entanglement to process information in ways classical computers cannot.\n\nKey concepts:\n• Qubits can be in multiple states simultaneously\n• Quantum entanglement links qubits together\n• Quantum algorithms can solve certain problems exponentially faster\n\nWould you like me to explain any specific aspect in more detail?";
    }
    
    if (lowerMessage.includes('code') || lowerMessage.includes('programming') || lowerMessage.includes('debug')) {
        return "I'd be happy to help with coding! I can assist with:\n\n• Writing code in various languages\n• Debugging and fixing errors\n• Explaining programming concepts\n• Optimizing algorithms\n• Code reviews\n\nWhat programming task would you like help with?";
    }
    
    if (lowerMessage.includes('write') || lowerMessage.includes('email') || lowerMessage.includes('content')) {
        return "I can definitely help you with writing! Whether it's:\n\n• Professional emails\n• Articles and blog posts\n• Creative content\n• Technical documentation\n• Reports and summaries\n\nJust let me know what you need, and I'll help you craft it. What are you looking to write?";
    }
    
    if (lowerMessage.includes('idea') || lowerMessage.includes('brainstorm') || lowerMessage.includes('creative')) {
        return "I love brainstorming! I can help generate ideas for:\n\n• Projects and businesses\n• Creative writing and storytelling\n• Problem-solving approaches\n• Marketing campaigns\n• Product features\n\nWhat area would you like to explore? The more context you provide, the better ideas I can suggest!";
    }
    
    const defaultResponses = [
        "That's an interesting question! Could you provide a bit more context so I can give you the most helpful answer?",
        "I'd be happy to help with that. Could you elaborate a bit more on what you're looking for?",
        "Great question! To give you the best response, could you share some more details about what you need?",
        "I'm here to assist! Can you tell me more about what you'd like to explore or accomplish?",
        "That's a fascinating topic. What specific aspect would you like to know more about?",
        "I can help with that! What particular information or guidance are you looking for?",
    ];
    
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
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