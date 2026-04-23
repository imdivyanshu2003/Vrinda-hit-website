/* =====================================================
   AI Website Preview Builder — Gamified Lead-Capture Flow
   Premium chatbot experience with XP, achievements, and
   immersive website-building animation
   ===================================================== */
(function () {
    'use strict';

    // Configuration
    const WHATSAPP_NUMBER = '917505483523';
    const TYPING_DELAY = 800;
    const STEP_DURATION = 1200;

    const questions = [
        {
            key: 'name',
            bot: "Hey there! 👋 I'm Vrinda AI — your personal website architect.\n\nLet's build something incredible together. What's your name?",
            placeholder: 'Enter your name',
            hint: 'e.g. Radha, Arjun, Priya',
            type: 'text',
            xp: 50,
            achievement: '🎯 Identity Unlocked',
            validate: (v) => v.trim().length >= 2 || 'Please enter at least 2 characters'
        },
        {
            key: 'idea',
            bot: (data) => `Great to meet you, ${data.name}! ✨\n\nNow tell me — what's the big idea? What kind of website do you want? Be specific and dream big!`,
            placeholder: 'Describe your dream website...',
            hint: 'e.g. A fitness coaching site, spiritual seva page, online store',
            type: 'text',
            xp: 100,
            achievement: '💡 Vision Captured',
            validate: (v) => v.trim().length >= 4 || 'Tell me more about your idea (at least 4 characters)'
        },
        {
            key: 'email',
            bot: (data) => `Love the vision! 🔥\n\nDrop your email — I'll send your website preview and exclusive design concepts here.`,
            placeholder: 'you@email.com',
            hint: 'We\'ll send your preview here',
            type: 'email',
            xp: 75,
            achievement: '📧 Connected',
            validate: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) || 'Please enter a valid email address'
        },
        {
            key: 'phone',
            bot: (data) => `Almost there, ${data.name}! 🚀\n\nYour WhatsApp number — so I can send you the live website link once it's ready.`,
            placeholder: '+91 98765 43210',
            hint: 'WhatsApp number with country code',
            type: 'tel',
            xp: 75,
            achievement: '📱 Mission Complete',
            validate: (v) => {
                const digits = v.replace(/\D/g, '');
                return digits.length >= 10 || 'Please enter a valid phone number (10+ digits)';
            }
        }
    ];

    // State
    const data = {};
    let currentStep = 0;
    let totalXP = 0;

    // DOM refs
    let messagesEl, inputEl, formEl, progressBar, hintEl;
    let chatScreen, loadingScreen, resultScreen;
    let xpCounter, xpFill, achievementToast, stepIndicator;

    function init() {
        messagesEl = document.getElementById('chat-messages');
        inputEl = document.getElementById('chat-input');
        formEl = document.getElementById('chat-input-form');
        progressBar = document.getElementById('progress-bar');
        hintEl = document.getElementById('input-hint');
        chatScreen = document.getElementById('chat-screen');
        loadingScreen = document.getElementById('loading-screen');
        resultScreen = document.getElementById('result-screen');
        xpCounter = document.getElementById('xp-counter');
        xpFill = document.getElementById('xp-fill');
        achievementToast = document.getElementById('achievement-toast');
        stepIndicator = document.getElementById('step-indicator');

        if (!formEl) return;

        formEl.addEventListener('submit', handleSubmit);

        const restartBtn = document.getElementById('restart-btn');
        if (restartBtn) restartBtn.addEventListener('click', restart);

        // Kick off
        askNext();
    }

    function askNext() {
        if (currentStep >= questions.length) {
            finishFlow();
            return;
        }

        const q = questions[currentStep];
        updateProgress();
        updateStepIndicator();
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

        // Store + echo
        data[q.key] = value;
        addUserMessage(value);
        inputEl.value = '';
        hintEl.textContent = '';
        hintEl.classList.remove('error');

        // Award XP + achievement
        awardXP(q.xp || 50);
        if (q.achievement) {
            setTimeout(() => showAchievement(q.achievement), 300);
        }

        currentStep++;
        askNext();
    }

    function awardXP(points) {
        totalXP += points;
        if (xpCounter) {
            animateNumber(xpCounter, totalXP - points, totalXP, 600);
        }
        if (xpFill) {
            const pct = Math.min(100, (totalXP / 300) * 100);
            xpFill.style.width = pct + '%';
        }
    }

    function animateNumber(el, from, to, duration) {
        const start = performance.now();
        const diff = to - from;
        function tick(now) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
            el.textContent = Math.round(from + diff * eased);
            if (progress < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
    }

    function showAchievement(text) {
        if (!achievementToast) return;
        achievementToast.textContent = text;
        achievementToast.classList.add('show');
        setTimeout(() => achievementToast.classList.remove('show'), 2200);
    }

    function updateStepIndicator() {
        if (!stepIndicator) return;
        stepIndicator.textContent = `Step ${currentStep + 1} of ${questions.length}`;
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

    // =============== Building animation steps ===============
    const buildingSteps = [
        { icon: 'ph-fill ph-brain', text: 'Analyzing your vision...', duration: 1800 },
        { icon: 'ph-fill ph-layout', text: 'Designing page structure...', duration: 1500 },
        { icon: 'ph-fill ph-palette', text: 'Applying premium styling...', duration: 1400 },
        { icon: 'ph-fill ph-device-mobile', text: 'Optimizing for mobile...', duration: 1200 },
        { icon: 'ph-fill ph-globe-hemisphere-west', text: 'Deploying to the cloud...', duration: 1000 },
        { icon: 'ph-fill ph-rocket-launch', text: 'Launching your website!', duration: 800 }
    ];

    function finishFlow() {
        updateProgress();

        // Final XP burst
        awardXP(0);

        // Hide chat, show loader
        chatScreen.classList.add('hidden');
        loadingScreen.classList.remove('hidden');

        // Animate building steps sequentially
        const stepsContainer = document.getElementById('progress-steps');
        if (stepsContainer) stepsContainer.innerHTML = '';

        let delay = 0;
        buildingSteps.forEach((step, idx) => {
            setTimeout(() => {
                // Add step item
                const li = document.createElement('li');
                li.innerHTML = `<i class="${step.icon}"></i> ${step.text}`;
                li.className = 'building-step';
                if (stepsContainer) stepsContainer.appendChild(li);

                // Update percentage
                const percentEl = document.getElementById('build-percent');
                if (percentEl) {
                    const pct = Math.round(((idx + 1) / buildingSteps.length) * 100);
                    animateNumber(percentEl, idx === 0 ? 0 : Math.round((idx / buildingSteps.length) * 100), pct, step.duration * 0.8);
                }

                // Update circular progress
                const circleProgress = document.getElementById('circle-progress');
                if (circleProgress) {
                    const pct = ((idx + 1) / buildingSteps.length) * 100;
                    const circumference = 2 * Math.PI * 54;
                    const offset = circumference - (pct / 100) * circumference;
                    circleProgress.style.strokeDashoffset = offset;
                }

                // Mark as done after duration
                setTimeout(() => {
                    li.classList.add('done');
                }, step.duration * 0.7);

            }, delay);
            delay += step.duration;
        });

        // After all steps -> show result
        setTimeout(showResult, delay + 600);
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

        // Launch confetti
        launchConfetti();

        // Scroll
        const builderEl = document.getElementById('builder');
        if (builderEl) builderEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function launchConfetti() {
        const canvas = document.getElementById('confetti-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        canvas.width = canvas.parentElement.offsetWidth;
        canvas.height = canvas.parentElement.offsetHeight;
        canvas.style.display = 'block';

        const colors = ['#7C3AED', '#EC4899', '#F59E0B', '#10B981', '#6366F1', '#F43F5E'];
        const particles = [];

        for (let i = 0; i < 80; i++) {
            particles.push({
                x: canvas.width * Math.random(),
                y: -20 - Math.random() * 100,
                w: 6 + Math.random() * 6,
                h: 4 + Math.random() * 4,
                color: colors[Math.floor(Math.random() * colors.length)],
                vx: (Math.random() - 0.5) * 3,
                vy: 2 + Math.random() * 4,
                rotation: Math.random() * 360,
                rotSpeed: (Math.random() - 0.5) * 10,
                opacity: 1
            });
        }

        let frame = 0;
        function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            let alive = false;

            particles.forEach(p => {
                if (p.opacity <= 0) return;
                alive = true;
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.1;
                p.rotation += p.rotSpeed;

                if (p.y > canvas.height * 0.7) {
                    p.opacity -= 0.02;
                }

                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate((p.rotation * Math.PI) / 180);
                ctx.globalAlpha = Math.max(0, p.opacity);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
                ctx.restore();
            });

            frame++;
            if (alive && frame < 200) {
                requestAnimationFrame(draw);
            } else {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                canvas.style.display = 'none';
            }
        }

        requestAnimationFrame(draw);
    }

    function toBrandName(name, idea) {
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
        currentStep = 0;
        totalXP = 0;
        for (const k in data) delete data[k];
        messagesEl.innerHTML = '';
        inputEl.value = '';
        hintEl.textContent = '';

        if (xpCounter) xpCounter.textContent = '0';
        if (xpFill) xpFill.style.width = '0%';

        const stepsContainer = document.getElementById('progress-steps');
        if (stepsContainer) stepsContainer.innerHTML = '';

        const percentEl = document.getElementById('build-percent');
        if (percentEl) percentEl.textContent = '0';

        const circleProgress = document.getElementById('circle-progress');
        if (circleProgress) {
            const circumference = 2 * Math.PI * 54;
            circleProgress.style.strokeDashoffset = circumference;
        }

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
