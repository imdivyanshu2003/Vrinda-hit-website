/* =====================================================
   AI Website Preview Builder — Chatbot lead-capture flow
   ===================================================== */
(function () {
    'use strict';

    // Configuration
    const WHATSAPP_NUMBER = '917505483523';
    const TYPING_DELAY = 700;
    const STEP_DURATION = 900;

    const questions = [
        {
            key: 'name',
            bot: "Hi! I'm Vrinda AI. Let's design your dream website in 60 seconds. ✨\n\nFirst — what should I call you?",
            placeholder: 'Your name',
            hint: 'e.g. Radha, Arjun, Priya',
            type: 'text',
            validate: (v) => v.trim().length >= 2 || 'Please enter at least 2 characters'
        },
        {
            key: 'idea',
            bot: (data) => `Nice to meet you, ${data.name}! 🙏\n\nWhat's your business or idea? (The more specific, the better your preview.)`,
            placeholder: 'e.g. Vrindavan seva page, fitness coaching, diet plans',
            hint: 'Tell me about your brand or service',
            type: 'text',
            validate: (v) => v.trim().length >= 4 || 'Please describe your idea in a bit more detail'
        },
        {
            key: 'email',
            bot: "Love it! 💫 Where should we send your preview and updates?",
            placeholder: 'you@email.com',
            hint: 'Your email address',
            type: 'email',
            validate: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) || 'Please enter a valid email'
        },
        {
            key: 'phone',
            bot: "Last step — your WhatsApp number so we can send your live website once it's built?",
            placeholder: '+91 98765 43210',
            hint: 'Include country code for faster response',
            type: 'tel',
            validate: (v) => {
                const digits = v.replace(/\D/g, '');
                return digits.length >= 10 || 'Please enter a valid phone number';
            }
        }
    ];

    // State
    const data = {};
    let currentStep = 0;

    // DOM refs (resolved on DOMContentLoaded)
    let messagesEl, inputEl, formEl, progressBar, hintEl;
    let chatScreen, loadingScreen, resultScreen;

    function init() {
        messagesEl = document.getElementById('chat-messages');
        inputEl = document.getElementById('chat-input');
        formEl = document.getElementById('chat-input-form');
        progressBar = document.getElementById('progress-bar');
        hintEl = document.getElementById('input-hint');
        chatScreen = document.getElementById('chat-screen');
        loadingScreen = document.getElementById('loading-screen');
        resultScreen = document.getElementById('result-screen');

        if (!formEl) return; // Builder not on this page

        formEl.addEventListener('submit', handleSubmit);

        const restartBtn = document.getElementById('restart-btn');
        if (restartBtn) restartBtn.addEventListener('click', restart);

        // Kick off the conversation
        askNext();
    }

    function askNext() {
        if (currentStep >= questions.length) {
            finishFlow();
            return;
        }

        const q = questions[currentStep];
        updateProgress();
        updateInputFor(q);
        showTypingThen(() => {
            const text = typeof q.bot === 'function' ? q.bot(data) : q.bot;
            addBotMessage(text);
            inputEl.focus();
        });
    }

    function handleSubmit(e) {
        e.preventDefault();
        const value = inputEl.value.trim();
        const q = questions[currentStep];
        if (!q) return;

        const validation = q.validate ? q.validate(value) : true;
        if (validation !== true) {
            showInputError(validation);
            return;
        }

        // Store + echo user message
        data[q.key] = value;
        addUserMessage(value);
        inputEl.value = '';
        hintEl.textContent = '';
        hintEl.classList.remove('error');

        currentStep++;
        askNext();
    }

    function addBotMessage(text) {
        const msg = document.createElement('div');
        msg.className = 'msg msg-bot';
        msg.innerHTML = `
            <div class="msg-avatar"><i class="ph-fill ph-sparkle"></i></div>
            <div class="msg-bubble">${escapeHtml(text).replace(/\n/g, '<br>')}</div>
        `;
        messagesEl.appendChild(msg);
        scrollToBottom();
    }

    function addUserMessage(text) {
        const msg = document.createElement('div');
        msg.className = 'msg msg-user';
        msg.innerHTML = `<div class="msg-bubble">${escapeHtml(text)}</div>`;
        messagesEl.appendChild(msg);
        scrollToBottom();
    }

    function showTypingThen(callback) {
        const typing = document.createElement('div');
        typing.className = 'msg msg-bot msg-typing';
        typing.innerHTML = `
            <div class="msg-avatar"><i class="ph-fill ph-sparkle"></i></div>
            <div class="msg-bubble typing-bubble">
                <span class="dot"></span><span class="dot"></span><span class="dot"></span>
            </div>
        `;
        messagesEl.appendChild(typing);
        scrollToBottom();

        setTimeout(() => {
            typing.remove();
            callback();
        }, TYPING_DELAY);
    }

    function updateInputFor(q) {
        inputEl.type = q.type || 'text';
        inputEl.placeholder = q.placeholder || 'Type your answer...';
        hintEl.textContent = q.hint || '';
        hintEl.classList.remove('error');
    }

    function showInputError(message) {
        hintEl.textContent = message;
        hintEl.classList.add('error');
        inputEl.classList.add('shake');
        setTimeout(() => inputEl.classList.remove('shake'), 400);
    }

    function updateProgress() {
        const pct = Math.min(100, (currentStep / questions.length) * 100);
        if (progressBar) progressBar.style.width = pct + '%';
    }

    function scrollToBottom() {
        messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    // =============== Final flow ===============
    function finishFlow() {
        updateProgress();
        // Hide chat, show loader
        chatScreen.classList.add('hidden');
        loadingScreen.classList.remove('hidden');

        const stepItems = document.querySelectorAll('#progress-steps li');
        stepItems.forEach((el, idx) => {
            setTimeout(() => markStepComplete(el), STEP_DURATION * (idx + 1));
        });

        // After all steps -> show result
        setTimeout(showResult, STEP_DURATION * (stepItems.length + 1));
    }

    function markStepComplete(el) {
        const icon = el.querySelector('i');
        if (icon) {
            icon.className = 'ph-fill ph-check-circle';
        }
        el.classList.add('done');
    }

    function showResult() {
        loadingScreen.classList.add('hidden');
        resultScreen.classList.remove('hidden');

        // Populate preview
        const brandName = toBrandName(data.name, data.idea);
        const tagline = craftTagline(data.idea);

        const nameEl = document.getElementById('preview-name');
        const brandEl = document.getElementById('preview-brand-name');
        const taglineEl = document.getElementById('preview-tagline');
        if (nameEl) nameEl.textContent = data.name;
        if (brandEl) brandEl.textContent = brandName;
        if (taglineEl) taglineEl.textContent = tagline;

        // Build WhatsApp pre-filled link
        const claimBtn = document.getElementById('claim-btn');
        if (claimBtn) {
            const message =
                `Hello! I just generated my website preview on vrindahitwebsite.com ✨\n\n` +
                `*Name:* ${data.name}\n` +
                `*Idea:* ${data.idea}\n` +
                `*Email:* ${data.email}\n` +
                `*WhatsApp:* ${data.phone}\n\n` +
                `I'd like to claim my website and get it built within 24 hours!`;
            claimBtn.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
        }

        // Scroll builder into view smoothly
        const builderEl = document.getElementById('builder');
        if (builderEl) builderEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function toBrandName(name, idea) {
        // Use first capitalized word from name, fallback to first word of idea
        const nm = (name || '').trim().split(/\s+/)[0];
        if (nm) return capitalize(nm) + "'s";
        const ideaWord = (idea || 'Your').trim().split(/\s+/)[0];
        return capitalize(ideaWord);
    }

    function craftTagline(idea) {
        if (!idea) return 'Your idea, live online';
        const clean = idea.trim();
        const short = clean.length > 60 ? clean.slice(0, 57) + '...' : clean;
        return short.charAt(0).toUpperCase() + short.slice(1);
    }

    function capitalize(s) {
        return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s;
    }

    function escapeHtml(s) {
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function restart() {
        // Reset state
        currentStep = 0;
        for (const k in data) delete data[k];
        messagesEl.innerHTML = '';
        inputEl.value = '';
        hintEl.textContent = '';

        // Reset step icons
        document.querySelectorAll('#progress-steps li').forEach((el) => {
            el.classList.remove('done');
            const icon = el.querySelector('i');
            if (icon) icon.className = 'ph ph-circle-dashed';
        });

        resultScreen.classList.add('hidden');
        loadingScreen.classList.add('hidden');
        chatScreen.classList.remove('hidden');

        askNext();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
