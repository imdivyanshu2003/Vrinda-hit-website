/* ==================================================================
   VRINDA HIT — AI Auto-Builder (Preview-first SaaS Flow)
   Flow: welcome → idea → theme → style → loading → preview+PRD →
         pricing → contact → success
   ================================================================== */
(function () {
    'use strict';

    const WHATSAPP_NUMBER = '917505483523';

    // -------- Theme configurations --------
    const THEMES = {
        spiritual: {
            label: 'Spiritual / Bhakti',
            emoji: '🌸',
            icon: 'ph-flower-lotus',
            defaultPalette: 'saffron',
            audience: 'devotees',
            action: 'book pooja or seva',
            servicesLabel: 'Seva & Services',
            services: [
                { icon: 'ph-flower-lotus', name: 'Pooja Booking', price: '₹501 onwards' },
                { icon: 'ph-moon-stars', name: 'Kundli Consultation', price: '₹1,100' },
                { icon: 'ph-users-three', name: 'Live Satsang Access', price: '₹251/month' }
            ],
            testimonial: '"Finally a professional home for my Bhakti seva. Devotees from abroad can now book easily." — Radhe Sevak, Vrindavan',
            sampleHero: 'Radhe Radhe 🙏 Bringing devotional seva online.',
            ctaText: 'Book Seva on WhatsApp'
        },
        fitness: {
            label: 'Fitness / Coaching',
            emoji: '💪',
            icon: 'ph-barbell',
            defaultPalette: 'midnight',
            audience: 'clients',
            action: 'book a coaching call',
            servicesLabel: 'Programs',
            services: [
                { icon: 'ph-barbell', name: '1-on-1 Coaching', price: '₹4,999/month' },
                { icon: 'ph-flag-banner', name: '12-Week Transformation', price: '₹9,999' },
                { icon: 'ph-users-three', name: 'Group Boot Camp', price: '₹1,999/month' }
            ],
            testimonial: '"I lost 18kg and got my life back. The coaching is 1000% worth it." — Priya, Delhi',
            sampleHero: 'Build the body you\'ve always wanted.',
            ctaText: 'Start Free Trial'
        },
        diet: {
            label: 'Diet / Nutrition',
            emoji: '🥗',
            icon: 'ph-leaf',
            defaultPalette: 'emerald',
            audience: 'wellness seekers',
            action: 'book a diet consultation',
            servicesLabel: 'Nutrition Plans',
            services: [
                { icon: 'ph-leaf', name: 'Personalized Meal Plan', price: '₹2,499' },
                { icon: 'ph-scales', name: 'Weight Loss Program', price: '₹5,999' },
                { icon: 'ph-heart', name: 'PCOS & Hormone Plan', price: '₹3,999' }
            ],
            testimonial: '"Lost 12kg in 4 months with zero starvation. Real food, real results." — Meera, Mumbai',
            sampleHero: 'Nutrition that fits your life, not the other way around.',
            ctaText: 'Book Free Call'
        },
        business: {
            label: 'Business / Creator',
            emoji: '💼',
            icon: 'ph-briefcase',
            defaultPalette: 'violet',
            audience: 'customers',
            action: 'reach out for a quote',
            servicesLabel: 'Our Services',
            services: [
                { icon: 'ph-rocket-launch', name: 'Flagship Service', price: 'From ₹9,999' },
                { icon: 'ph-chart-line-up', name: 'Growth Package', price: 'From ₹24,999' },
                { icon: 'ph-handshake', name: 'Consultation Call', price: '₹1,499' }
            ],
            testimonial: '"Their service 3x\'d my revenue in 6 months. Can\'t recommend enough." — Arjun, Founder',
            sampleHero: 'Modern solutions for ambitious businesses.',
            ctaText: 'Get in Touch'
        }
    };

    // -------- Palette definitions (CSS variable overrides for preview) --------
    const PALETTES = {
        violet:   { primary: '#7C3AED', accent: '#EC4899', soft: '#F5F0FF', text: '#1E1B4B', bg: '#FFFFFF' },
        saffron:  { primary: '#F59E0B', accent: '#DC2626', soft: '#FFFBEB', text: '#7C2D12', bg: '#FFFDF7' },
        emerald:  { primary: '#10B981', accent: '#0891B2', soft: '#D1FAE5', text: '#064E3B', bg: '#FFFFFF' },
        rose:     { primary: '#EC4899', accent: '#A855F7', soft: '#FCE7F3', text: '#831843', bg: '#FFFFFF' },
        midnight: { primary: '#6366F1', accent: '#F59E0B', soft: '#E0E7FF', text: '#FFFFFF', bg: '#1E1B4B' }
    };

    // -------- Style tweaks (affects preview radius, spacing, typography) --------
    const STYLES = {
        modern:  { radius: '14px', buttonShape: '12px', font: 'Outfit, sans-serif', vibe: 'clean startup look' },
        minimal: { radius: '4px', buttonShape: '4px', font: 'Inter, sans-serif', vibe: 'ultra-clean editorial' },
        premium: { radius: '24px', buttonShape: '999px', font: 'Outfit, serif', vibe: 'luxurious & high-end' },
        bold:    { radius: '0px', buttonShape: '0px', font: 'Outfit, sans-serif', vibe: 'confident & loud' }
    };

    const PLANS = {
        basic:   { name: 'Basic',   price: 299,  label: 'Basic ₹299' },
        premium: { name: 'Premium', price: 999,  label: 'Premium ₹999' },
        pro:     { name: 'Pro',     price: 1999, label: 'Pro ₹1999 (with .com)' }
    };

    // -------- Flow mapping (for progress bar + step counter) --------
    const STEP_ORDER = ['welcome', 'idea', 'theme', 'style', 'loading', 'preview', 'pricing', 'contact', 'success'];
    const STEP_LABELS = {
        welcome: { n: 0, of: 5 }, idea: { n: 1, of: 5 }, theme: { n: 2, of: 5 },
        style: { n: 3, of: 5 }, loading: { n: 4, of: 5 }, preview: { n: 4, of: 5 },
        pricing: { n: 5, of: 5 }, contact: { n: 5, of: 5 }, success: { n: 5, of: 5 }
    };

    // -------- State --------
    const state = {
        current: 'welcome',
        idea: '',
        brand: '',
        theme: null,
        style: null,
        palette: null,
        plan: null,
        email: '',
        phone: ''
    };

    // -------- Init --------
    function init() {
        const root = document.getElementById('chat-builder');
        if (!root) return;

        root.addEventListener('click', handleClick);
        updateHeader();

        // Persist in sessionStorage so "Open full preview in new tab" can read it
        window.addEventListener('beforeunload', persistState);
    }

    function persistState() {
        try { localStorage.setItem('vrindaBuilderState', JSON.stringify(state)); } catch (e) {}
    }

    // -------- Click dispatcher --------
    function handleClick(e) {
        const actionEl = e.target.closest('[data-action]');
        if (actionEl) {
            e.preventDefault();
            const action = actionEl.getAttribute('data-action');
            handleAction(action, actionEl);
            return;
        }
        const themeCard = e.target.closest('.theme-card');
        if (themeCard) { selectTheme(themeCard.dataset.theme); return; }
        const styleCard = e.target.closest('.style-card');
        if (styleCard) { selectStyle(styleCard.dataset.style); return; }
        const paletteSwatch = e.target.closest('.palette-swatch');
        if (paletteSwatch) { selectPalette(paletteSwatch.dataset.palette); return; }
    }

    function handleAction(action, el) {
        switch (action) {
            case 'start':           goTo('idea'); break;
            case 'back':            goBack(); break;
            case 'next-idea':       submitIdea(); break;
            case 'generate':        startGeneration(); break;
            case 'edit-details':    goTo('idea'); break;
            case 'go-pricing':      goTo('pricing'); break;
            case 'back-to-preview': goTo('preview'); break;
            case 'select-plan':     selectPlan(el.dataset.plan); break;
            case 'back-to-pricing': goTo('pricing'); break;
            case 'restart':         restart(); break;
        }
    }

    // -------- Navigation --------
    function goTo(screenName) {
        const screens = document.querySelectorAll('.builder-screen');
        screens.forEach(s => s.classList.toggle('hidden', s.dataset.screen !== screenName));
        state.current = screenName;
        updateHeader();
        // Scroll builder into view for mobile
        const section = document.getElementById('builder');
        if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function goBack() {
        const order = { idea: 'welcome', theme: 'idea', style: 'theme', pricing: 'preview', contact: 'pricing' };
        goTo(order[state.current] || 'welcome');
    }

    function updateHeader() {
        const stepCounter = document.getElementById('step-counter');
        const progressBar = document.getElementById('progress-bar');
        const s = STEP_LABELS[state.current];
        if (stepCounter) {
            stepCounter.textContent = s.n === 0 ? 'Get started' : `Step ${s.n} of ${s.of}`;
        }
        if (progressBar) {
            const pct = (s.n / s.of) * 100;
            progressBar.style.width = pct + '%';
        }
    }

    // -------- Step 2: Idea --------
    function submitIdea() {
        const ideaEl = document.getElementById('idea-input');
        const brandEl = document.getElementById('brand-input');
        const idea = (ideaEl.value || '').trim();
        if (idea.length < 8) {
            ideaEl.classList.add('shake');
            setTimeout(() => ideaEl.classList.remove('shake'), 400);
            ideaEl.focus();
            return;
        }
        state.idea = idea;
        state.brand = (brandEl.value || '').trim();
        goTo('theme');
    }

    // -------- Step 3: Theme --------
    function selectTheme(themeKey) {
        state.theme = themeKey;
        state.palette = THEMES[themeKey].defaultPalette; // preselect palette
        document.querySelectorAll('.theme-card').forEach(c => {
            c.classList.toggle('selected', c.dataset.theme === themeKey);
        });
        setTimeout(() => {
            goTo('style');
            // Pre-highlight default palette
            document.querySelectorAll('.palette-swatch').forEach(p => {
                p.classList.toggle('selected', p.dataset.palette === state.palette);
            });
            refreshGenerateBtn();
        }, 280);
    }

    // -------- Step 4: Style + palette --------
    function selectStyle(styleKey) {
        state.style = styleKey;
        document.querySelectorAll('.style-card').forEach(c => {
            c.classList.toggle('selected', c.dataset.style === styleKey);
        });
        refreshGenerateBtn();
    }

    function selectPalette(paletteKey) {
        state.palette = paletteKey;
        document.querySelectorAll('.palette-swatch').forEach(p => {
            p.classList.toggle('selected', p.dataset.palette === paletteKey);
        });
        refreshGenerateBtn();
    }

    function refreshGenerateBtn() {
        const btn = document.getElementById('generate-btn');
        if (!btn) return;
        btn.disabled = !(state.style && state.palette);
    }

    // -------- Step 5: Loading / Generation --------
    function startGeneration() {
        if (!state.style || !state.palette) return;
        goTo('loading');
        animateGeneration();
    }

    function animateGeneration() {
        const steps = document.querySelectorAll('#progress-steps li');
        const total = steps.length;
        const perStep = 1100; // ms
        const percentEl = document.getElementById('build-percent');
        const circle = document.getElementById('circle-progress');
        const circumference = 2 * Math.PI * 54;
        if (circle) {
            circle.style.strokeDasharray = circumference;
            circle.style.strokeDashoffset = circumference;
        }

        steps.forEach((el, idx) => {
            setTimeout(() => {
                const icon = el.querySelector('i');
                if (icon) icon.className = 'ph-fill ph-check-circle';
                el.classList.add('done');

                // Animate percent + circle progress
                const pct = Math.round(((idx + 1) / total) * 100);
                if (percentEl) animateNumber(percentEl, parseInt(percentEl.textContent) || 0, pct, 800);
                if (circle) {
                    const offset = circumference - (pct / 100) * circumference;
                    circle.style.strokeDashoffset = offset;
                }
            }, perStep * (idx + 1));
        });

        // After all steps, show preview
        setTimeout(() => {
            renderPreview();
            renderPRD();
            goTo('preview');
            fireConfetti();
        }, perStep * (total + 1));
    }

    function animateNumber(el, from, to, duration) {
        const start = performance.now();
        function tick(now) {
            const t = Math.min(1, (now - start) / duration);
            const value = Math.round(from + (to - from) * t);
            el.textContent = value;
            if (t < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
    }

    // -------- Step 6: Preview rendering --------
    function renderPreview() {
        const screen = document.getElementById('live-preview-screen');
        if (!screen) return;

        const theme = THEMES[state.theme];
        const palette = PALETTES[state.palette];
        const style = STYLES[state.style];
        const brandName = state.brand || craftBrandName(state.idea, theme);

        screen.innerHTML = buildPreviewHTML({ brandName, theme, palette, style, idea: state.idea });
        screen.style.setProperty('--p-primary', palette.primary);
        screen.style.setProperty('--p-accent', palette.accent);
        screen.style.setProperty('--p-soft', palette.soft);
        screen.style.setProperty('--p-text', palette.text);
        screen.style.setProperty('--p-bg', palette.bg);
        screen.style.setProperty('--p-radius', style.radius);
        screen.style.setProperty('--p-btn-radius', style.buttonShape);
        screen.style.fontFamily = style.font;

        // Full-preview link (opens new tab, reads state from sessionStorage)
        const fullBtn = document.getElementById('open-full-preview');
        if (fullBtn) {
            persistState();
            fullBtn.href = '/preview.html';
        }
    }

    function buildPreviewHTML({ brandName, theme, palette, style, idea }) {
        const tagline = escapeHtml(idea.length > 90 ? idea.slice(0, 87) + '...' : idea);
        const servicesHtml = theme.services.map(s => `
            <div class="lp-service">
                <div class="lp-service-icon"><i class="ph-fill ${s.icon}"></i></div>
                <div class="lp-service-body">
                    <div class="lp-service-name">${escapeHtml(s.name)}</div>
                    <div class="lp-service-price">${escapeHtml(s.price)}</div>
                </div>
                <i class="ph ph-arrow-right"></i>
            </div>
        `).join('');

        return `
            <div class="lp-wrap">
                <nav class="lp-nav">
                    <div class="lp-logo"><i class="ph-fill ${theme.icon}"></i> ${escapeHtml(brandName)}</div>
                    <i class="ph ph-list"></i>
                </nav>

                <section class="lp-hero">
                    <div class="lp-pill"><i class="ph ph-sparkle"></i> ${escapeHtml(theme.label)}</div>
                    <h1>${escapeHtml(theme.sampleHero)}</h1>
                    <p class="lp-hero-sub">${tagline || 'Your idea, beautifully online.'}</p>
                    <button class="lp-cta lp-cta-primary"><i class="ph-fill ph-whatsapp-logo"></i> ${escapeHtml(theme.ctaText)}</button>
                    <div class="lp-trust">
                        <span><i class="ph-fill ph-check-circle"></i> Trusted by 500+</span>
                        <span><i class="ph-fill ph-star"></i> 4.9 / 5</span>
                    </div>
                </section>

                <section class="lp-section">
                    <div class="lp-section-head">
                        <span class="lp-section-tag">${escapeHtml(theme.servicesLabel)}</span>
                        <h2>What we offer</h2>
                    </div>
                    <div class="lp-services">${servicesHtml}</div>
                </section>

                <section class="lp-section lp-about">
                    <div class="lp-section-head">
                        <span class="lp-section-tag">About</span>
                        <h2>About ${escapeHtml(brandName)}</h2>
                    </div>
                    <p>${escapeHtml(idea) || 'We help ' + theme.audience + ' get the results they deserve — with care, clarity, and quality.'}</p>
                </section>

                <section class="lp-section lp-testimonial-section">
                    <div class="lp-quote-icon">"</div>
                    <p class="lp-testimonial">${escapeHtml(theme.testimonial)}</p>
                </section>

                <section class="lp-section lp-cta-section">
                    <h2>Ready to get started?</h2>
                    <p>Chat with us on WhatsApp — we reply in minutes.</p>
                    <button class="lp-cta lp-cta-primary"><i class="ph-fill ph-whatsapp-logo"></i> ${escapeHtml(theme.ctaText)}</button>
                </section>

                <footer class="lp-footer">
                    <div>© ${new Date().getFullYear()} ${escapeHtml(brandName)}</div>
                    <div class="lp-footer-made">Built with ✨ by vrindahitwebsite.com</div>
                </footer>
            </div>
        `;
    }

    function craftBrandName(idea, theme) {
        const words = (idea || '').trim().split(/\s+/).slice(0, 3);
        const pick = words.find(w => w.length >= 4 && /^[a-zA-Z]/.test(w));
        if (pick) return capitalize(pick);
        return theme.label.split(' ')[0];
    }

    // -------- PRD rendering --------
    function renderPRD() {
        const theme = THEMES[state.theme];
        const style = STYLES[state.style];
        const brandName = state.brand || craftBrandName(state.idea, theme);

        document.getElementById('prd-title').textContent = `${brandName} — Website Plan`;
        document.getElementById('prd-purpose').textContent =
            `A ${style.vibe} ${theme.label.toLowerCase()} website designed to convert ${theme.audience} into people who ${theme.action}.`;

        const sections = [
            { name: 'Hero Section', purpose: `Grab attention in 3 seconds with a clear promise and one primary CTA (${theme.ctaText}).` },
            { name: `${theme.servicesLabel} Grid`, purpose: `Show 3 clear offerings with transparent pricing to reduce friction.` },
            { name: 'About Section', purpose: `Build trust with ${theme.audience} through authentic, specific storytelling.` },
            { name: 'Testimonials', purpose: 'Social proof from past clients/devotees — highest trust multiplier.' },
            { name: 'Final CTA + Footer', purpose: 'Second conversion point + WhatsApp integration for instant contact.' }
        ];
        const sectionsEl = document.getElementById('prd-sections');
        sectionsEl.innerHTML = sections.map(s => `
            <li>
                <strong>${escapeHtml(s.name)}</strong>
                <span>${escapeHtml(s.purpose)}</span>
            </li>
        `).join('');

        document.getElementById('prd-conversion').textContent =
            `One primary goal per screen → minimal distraction. Sticky WhatsApp CTA across all pages. Clear pricing above the fold reduces drop-off.`;
    }

    // -------- Pricing / Plan selection --------
    function selectPlan(planKey) {
        state.plan = planKey;
        const selectedLabelEl = document.getElementById('selected-plan-label');
        if (selectedLabelEl) selectedLabelEl.textContent = PLANS[planKey].name;
        const summary = document.getElementById('plan-summary');
        if (summary) {
            summary.innerHTML = `
                <div class="summary-row"><span>Plan</span><strong>${PLANS[planKey].label}</strong></div>
                <div class="summary-row"><span>Theme</span><strong>${THEMES[state.theme].label}</strong></div>
                <div class="summary-row"><span>Style</span><strong>${capitalize(state.style)} / ${capitalize(state.palette)}</strong></div>
                <div class="summary-row total"><span>You pay</span><strong>₹${PLANS[planKey].price}</strong></div>
            `;
        }
        goTo('contact');
    }

    // -------- Final claim (WhatsApp pre-fill) --------
    function bindClaimButton() {
        const claimBtn = document.getElementById('claim-btn');
        if (!claimBtn) return;
        claimBtn.addEventListener('click', (e) => {
            const emailEl = document.getElementById('email-input');
            const phoneEl = document.getElementById('phone-input');
            const email = (emailEl.value || '').trim();
            const phone = (phoneEl.value || '').trim();

            const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
            const phoneOk = phone.replace(/\D/g, '').length >= 10;

            if (!emailOk) { emailEl.focus(); shake(emailEl); e.preventDefault(); return; }
            if (!phoneOk) { phoneEl.focus(); shake(phoneEl); e.preventDefault(); return; }

            state.email = email;
            state.phone = phone;

            const theme = THEMES[state.theme];
            const plan = PLANS[state.plan];
            const brandName = state.brand || craftBrandName(state.idea, theme);

            const message =
                `Hello Vrinda Hit! 🙏 I just built my preview on vrindahitwebsite.com ✨\n\n` +
                `*Brand:* ${brandName}\n` +
                `*Idea:* ${state.idea}\n` +
                `*Theme:* ${theme.label}\n` +
                `*Style:* ${capitalize(state.style)} + ${capitalize(state.palette)} palette\n` +
                `*Plan:* ${plan.label} (₹${plan.price})\n` +
                `*Email:* ${email}\n` +
                `*WhatsApp:* ${phone}\n\n` +
                `I'd like to claim my website and get it delivered in 24 hours!`;

            claimBtn.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

            // Show success screen after a short delay (WhatsApp takes over)
            setTimeout(() => {
                renderSuccess();
                goTo('success');
            }, 700);
        });
    }

    function renderSuccess() {
        const theme = THEMES[state.theme];
        const plan = PLANS[state.plan];
        const brandName = state.brand || craftBrandName(state.idea, theme);
        const summary = document.getElementById('success-summary');
        if (summary) {
            summary.innerHTML = `
                <div class="summary-row"><span>Brand</span><strong>${escapeHtml(brandName)}</strong></div>
                <div class="summary-row"><span>Plan</span><strong>${plan.label}</strong></div>
                <div class="summary-row"><span>Delivery</span><strong>Within 24 hours</strong></div>
            `;
        }
    }

    function shake(el) {
        el.classList.add('shake');
        setTimeout(() => el.classList.remove('shake'), 400);
    }

    // -------- Restart --------
    function restart() {
        state.current = 'welcome';
        state.idea = ''; state.brand = ''; state.theme = null;
        state.style = null; state.palette = null; state.plan = null;
        state.email = ''; state.phone = '';

        document.querySelectorAll('.theme-card, .style-card, .palette-swatch')
            .forEach(el => el.classList.remove('selected'));
        const ideaInput = document.getElementById('idea-input'); if (ideaInput) ideaInput.value = '';
        const brandInput = document.getElementById('brand-input'); if (brandInput) brandInput.value = '';
        const emailInput = document.getElementById('email-input'); if (emailInput) emailInput.value = '';
        const phoneInput = document.getElementById('phone-input'); if (phoneInput) phoneInput.value = '';

        // Reset loading steps
        document.querySelectorAll('#progress-steps li').forEach(el => {
            el.classList.remove('done');
            const i = el.querySelector('i');
            if (i) i.className = 'ph ph-circle-dashed';
        });
        const percentEl = document.getElementById('build-percent');
        if (percentEl) percentEl.textContent = '0';

        goTo('welcome');
    }

    // -------- Confetti (lightweight canvas) --------
    function fireConfetti() {
        const canvas = document.getElementById('confetti-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const rect = canvas.parentElement.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;

        const colors = ['#7C3AED', '#EC4899', '#F59E0B', '#10B981', '#6366F1'];
        const pieces = [];
        for (let i = 0; i < 120; i++) {
            pieces.push({
                x: Math.random() * canvas.width,
                y: -20 - Math.random() * 100,
                r: 3 + Math.random() * 5,
                color: colors[Math.floor(Math.random() * colors.length)],
                vx: -2 + Math.random() * 4,
                vy: 2 + Math.random() * 4,
                rot: Math.random() * Math.PI,
                vrot: -0.2 + Math.random() * 0.4
            });
        }
        let frame = 0;
        const maxFrames = 180;
        function tick() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            pieces.forEach(p => {
                p.x += p.vx; p.y += p.vy; p.rot += p.vrot;
                p.vy += 0.05;
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rot);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r);
                ctx.restore();
            });
            frame++;
            if (frame < maxFrames) requestAnimationFrame(tick);
            else ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        tick();
    }

    // -------- Helpers --------
    function escapeHtml(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    }
    function capitalize(s) {
        return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
    }

    // -------- Boot --------
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => { init(); bindClaimButton(); });
    } else {
        init(); bindClaimButton();
    }

    // Expose state for preview.html
    window.__vrindaBuilderState = state;
    window.__vrindaBuilderConfig = { THEMES, PALETTES, STYLES, PLANS };
})();
