// ============================================================
//  VRINDA HIT — AI WEBSITE GENERATION ENDPOINT
//  POST /api/generate
//  Calls Claude API to produce a complete single-file HTML website,
//  uploads it to Supabase Storage, records a row in `sites`, and
//  returns { slug, url }.
// ============================================================

import Anthropic from '@anthropic-ai/sdk';
import { getSupabase, SITES_BUCKET } from './_lib/supabase.js';

// -------- Theme knowledge (matches builder.js) --------
const THEMES = {
    spiritual: {
        label: 'Spiritual / Bhakti',
        audience: 'devotees, bhakts, spiritual seekers',
        flavor: 'Hindu-devotional, warm, sacred',
        primaryGoal: 'book pooja / seva / consultation',
        sections: ['hero', 'seva list with prices', 'about/guru intro', 'testimonials', 'live satsang schedule', 'booking CTA', 'footer'],
        iconSet: 'lotus, om, moon, prayer'
    },
    fitness: {
        label: 'Fitness / Coaching',
        audience: 'people wanting body transformation',
        flavor: 'bold, motivational, high-energy',
        primaryGoal: 'book a free discovery call',
        sections: ['hero with strong promise', 'programs/packages', 'transformation results', 'coach bio', 'testimonials', 'booking CTA', 'footer'],
        iconSet: 'barbell, flame, trophy, heartbeat'
    },
    diet: {
        label: 'Diet / Nutrition',
        audience: 'people seeking healthy lifestyle',
        flavor: 'clean, fresh, trustworthy',
        primaryGoal: 'book a free nutrition consultation',
        sections: ['hero with clear promise', 'plans/packages', 'about nutritionist credentials', 'client success stories', 'before/after hints', 'booking CTA', 'footer'],
        iconSet: 'leaf, apple, heart, scales'
    },
    business: {
        label: 'Business / Creator',
        audience: 'potential customers',
        flavor: 'professional, modern, credible',
        primaryGoal: 'reach out for a quote / consultation',
        sections: ['hero with value prop', 'services grid', 'why choose us', 'case studies/work', 'testimonials', 'contact CTA', 'footer'],
        iconSet: 'briefcase, rocket, chart, handshake'
    }
};

const PALETTES = {
    violet:   { primary: '#7C3AED', accent: '#EC4899', soft: '#F5F0FF', text: '#1E1B4B', bg: '#FFFFFF', name: 'Violet Glow' },
    saffron:  { primary: '#F59E0B', accent: '#DC2626', soft: '#FFFBEB', text: '#7C2D12', bg: '#FFFDF7', name: 'Saffron Bhakti' },
    emerald:  { primary: '#10B981', accent: '#0891B2', soft: '#D1FAE5', text: '#064E3B', bg: '#FFFFFF', name: 'Emerald Fresh' },
    rose:     { primary: '#EC4899', accent: '#A855F7', soft: '#FCE7F3', text: '#831843', bg: '#FFFFFF', name: 'Rose Premium' },
    midnight: { primary: '#6366F1', accent: '#F59E0B', soft: '#E0E7FF', text: '#1E1B4B', bg: '#F8FAFC', name: 'Midnight Bold' }
};

const STYLES = {
    modern:  { vibe: 'clean modern startup aesthetic with rounded corners', radius: '14px', btnRadius: '12px', font: "'Outfit', 'Inter', sans-serif" },
    minimal: { vibe: 'ultra-clean editorial minimalism with sharp edges',    radius: '4px',  btnRadius: '4px',  font: "'Inter', sans-serif" },
    premium: { vibe: 'luxurious high-end feel with generous spacing & pill buttons', radius: '24px', btnRadius: '999px', font: "'Outfit', 'Playfair Display', serif" },
    bold:    { vibe: 'confident, loud, high-contrast with strong geometry', radius: '0px',  btnRadius: '0px',  font: "'Outfit', sans-serif" }
};

const PLAN_FEATURES = {
    basic:   { sections: 4, tier: 'Basic',   notes: 'Single-page site with 4 sections, essential content only.' },
    premium: { sections: 7, tier: 'Premium', notes: 'Full single-page site with 7 sections, animations, testimonials, FAQ.' },
    pro:     { sections: 8, tier: 'Pro',     notes: 'Premium site + extra polish: FAQ accordion, newsletter, gallery grid. Delivered with custom .com setup.' }
};

// -------- Slug generator --------
function slugify(str) {
    return String(str || '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .slice(0, 40) || 'site';
}

function uniqueSlug(base) {
    const rand = Math.random().toString(36).slice(2, 6);
    return `${base}-${rand}`;
}

// -------- Prompt builder --------
function buildPrompt({ idea, brand, theme, style, palette, plan, email, phone }) {
    const t = THEMES[theme];
    const p = PALETTES[palette];
    const s = STYLES[style];
    const pf = PLAN_FEATURES[plan] || PLAN_FEATURES.premium;

    return `You are an elite web designer + frontend developer. Produce ONE complete, self-contained, production-ready HTML file for the following real paying customer. This file will be served directly at vrindahitwebsite.com/s/<slug> and the customer will see it live in 60 seconds after paying.

## CUSTOMER BRIEF
- Brand name: ${brand || 'auto-generate a tasteful short name from the idea below'}
- Their idea / description: "${idea}"
- Contact email: ${email || 'not provided'}
- Contact WhatsApp: ${phone || '+91 75054 83523'}

## NICHE & TONE
- Theme: ${t.label}
- Audience: ${t.audience}
- Primary conversion goal: ${t.primaryGoal}
- Flavor / tone: ${t.flavor}
- Suggested icon vocabulary: ${t.iconSet}

## DESIGN SYSTEM
- Style vibe: ${s.vibe}
- Border radius: ${s.radius} (use on cards/images)
- Button radius: ${s.btnRadius}
- Font stack: ${s.font} (load Google Fonts link in <head>)
- Color palette (use these exact hex values as CSS custom properties):
  - --primary: ${p.primary}
  - --accent: ${p.accent}
  - --soft: ${p.soft}     (section backgrounds, subtle tints)
  - --text: ${p.text}
  - --bg: ${p.bg}         (page background)

## PLAN TIER: ${pf.tier}
${pf.notes}
Number of major sections to include: ${pf.sections}

## STRICT REQUIREMENTS
1. **Output ONLY one complete HTML document**, starting with <!DOCTYPE html> and ending with </html>. No markdown code fences. No explanations. No prefix text. Just raw HTML.
2. **Single file** — inline all CSS in a <style> tag. Inline any JS (keep it minimal).
3. **Mobile-first responsive** — looks great on 375px phones.
4. **Use Phosphor Icons via CDN**: <script src="https://unpkg.com/@phosphor-icons/web"></script> in <head>. Use icons throughout (e.g., <i class="ph-fill ph-lotus"></i>).
5. **Load Google Fonts** in <head> with preconnect.
6. **Sections to include (at minimum, adapt names to the niche)**:
   ${t.sections.slice(0, pf.sections).map((sec, i) => `${i + 1}. ${sec}`).join('\n   ')}
7. **Primary CTA appears 2-3 times** — must be a WhatsApp link: https://wa.me/${(phone || '917505483523').replace(/\D/g, '')}?text=${encodeURIComponent('Hi! I found your website and want to connect.')}
8. **Copywriting** must be specific to their actual idea — NOT generic placeholder text. Pull facts/claims from the idea brief. If the idea is vague, invent plausible specifics that match the niche (e.g., for a yoga coach: "200+ students trained, Certified RYT-500").
9. **SEO**: include proper <title>, <meta name="description">, Open Graph tags. Title should use brand name + niche keyword.
10. **Trust signals**: include at least 2 testimonials with Indian-sounding names (relevant to niche), a trust bar ("Trusted by 500+ ${t.audience}", star rating), and clear contact info in footer.
11. **Animations**: use subtle CSS animations (fade-in on scroll via simple IntersectionObserver, hover lifts on cards). Don't overdo it.
12. **Footer** must include: © ${new Date().getFullYear()} [brand], WhatsApp contact, small "Built with AI in 60 seconds by vrindahitwebsite.com" credit line.
13. **Accessibility**: semantic HTML, alt texts where applicable, sufficient color contrast.
14. **Performance**: no images (use CSS gradients, icon illustrations, emoji where helpful). Keep total page under 80KB.

## OUTPUT FORMAT
Raw HTML only. Begin your response with <!DOCTYPE html> literally as the first characters. End with </html>. Nothing else.`;
}

// -------- Extract HTML from Claude response --------
function extractHtml(text) {
    if (!text) return null;
    // Strip possible markdown fences
    const cleaned = text.replace(/^```(?:html)?\s*/i, '').replace(/```\s*$/, '').trim();
    const start = cleaned.indexOf('<!DOCTYPE');
    const end = cleaned.lastIndexOf('</html>');
    if (start === -1 || end === -1) return null;
    return cleaned.slice(start, end + '</html>'.length);
}

// -------- Handler --------
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Optional shared-secret gate (set INTERNAL_API_SECRET in Vercel env,
    // then send as x-internal-secret header). Leave unset during early testing.
    const secret = process.env.INTERNAL_API_SECRET;
    if (secret && req.headers['x-internal-secret'] !== secret) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    let body = req.body;
    if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch (e) { return res.status(400).json({ error: 'Invalid JSON body' }); }
    }

    const { idea, brand, theme, style, palette, plan = 'premium', email, phone, orderId } = body || {};

    // Basic validation
    if (!idea || idea.length < 8) return res.status(400).json({ error: 'Missing or too-short idea' });
    if (!THEMES[theme])    return res.status(400).json({ error: `Invalid theme: ${theme}` });
    if (!STYLES[style])    return res.status(400).json({ error: `Invalid style: ${style}` });
    if (!PALETTES[palette]) return res.status(400).json({ error: `Invalid palette: ${palette}` });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured in env' });

    const client = new Anthropic({ apiKey });

    try {
        const startedAt = Date.now();
        const message = await client.messages.create({
            model: 'claude-sonnet-4-5',
            max_tokens: 16000,
            temperature: 0.7,
            messages: [
                { role: 'user', content: buildPrompt({ idea, brand, theme, style, palette, plan, email, phone }) }
            ]
        });

        const rawText = (message.content || [])
            .filter(b => b.type === 'text')
            .map(b => b.text)
            .join('\n');

        const html = extractHtml(rawText);
        if (!html) {
            return res.status(502).json({
                error: 'Claude response did not contain valid HTML',
                preview: rawText.slice(0, 400)
            });
        }

        // Build unique slug based on brand/idea
        const baseSlug = slugify(brand || idea.split(/\s+/).slice(0, 3).join(' '));
        const slug = uniqueSlug(baseSlug);

        // ---------- Store in Supabase ----------
        const supabase = getSupabase();
        const storagePath = `${slug}.html`;
        const htmlSizeBytes = Buffer.byteLength(html, 'utf8');
        const tokensIn  = message.usage?.input_tokens  || 0;
        const tokensOut = message.usage?.output_tokens || 0;
        const latencyMs = Date.now() - startedAt;

        // 1. Upload HTML file to private bucket
        const { error: uploadErr } = await supabase.storage
            .from(SITES_BUCKET)
            .upload(storagePath, html, {
                contentType: 'text/html; charset=utf-8',
                upsert: false
            });
        if (uploadErr) {
            console.error('[generate] storage upload failed:', uploadErr);
            return res.status(500).json({ error: 'Storage upload failed', message: uploadErr.message });
        }

        // 2. Insert row in `sites` table
        const { error: insertErr } = await supabase.from('sites').insert({
            slug,
            order_id: orderId || null,
            brand: brand || null,
            idea,
            theme,
            style,
            palette,
            plan,
            email: email || null,
            phone: phone || null,
            storage_path: storagePath,
            html_size_bytes: htmlSizeBytes,
            model: message.model,
            tokens_in: tokensIn,
            tokens_out: tokensOut,
            latency_ms: latencyMs
        });
        if (insertErr) {
            console.error('[generate] sites insert failed:', insertErr);
            // Best-effort cleanup so we don't orphan the HTML file
            try { await supabase.storage.from(SITES_BUCKET).remove([storagePath]); } catch (_) {}
            return res.status(500).json({ error: 'DB insert failed', message: insertErr.message });
        }

        // 3. Mark the order as generated (if an orderId was provided)
        if (orderId) {
            await supabase.from('orders')
                .update({ status: 'generated', slug, updated_at: new Date().toISOString() })
                .eq('id', orderId);
        }

        const publicUrl = `https://vrindahitwebsite.com/s/${slug}`;
        return res.status(200).json({
            ok: true,
            slug,
            url: publicUrl,
            meta: {
                tokensIn,
                tokensOut,
                latencyMs,
                sizeKb: Math.round(htmlSizeBytes / 102.4) / 10
            }
        });
    } catch (err) {
        console.error('[generate] error:', err);
        return res.status(500).json({
            error: 'Generation failed',
            message: err?.message || String(err)
        });
    }
}
