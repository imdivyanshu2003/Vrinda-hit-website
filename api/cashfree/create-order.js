// ============================================================
//  POST /api/cashfree/create-order
//  Body: { idea, brand, theme, style, palette, plan, email, phone }
//  - Inserts a pending row in `orders`
//  - Creates a Cashfree order (order_id = our orders.id UUID)
//  - Returns { orderId, paymentSessionId, mode }
// ============================================================

import { getSupabase } from '../_lib/supabase.js';
import { createCashfreeOrder, cashfreeMode } from '../_lib/cashfree.js';

const PLANS = { basic: 299, premium: 999, pro: 1999 };
const VALID_THEMES   = ['spiritual', 'fitness', 'diet', 'business'];
const VALID_STYLES   = ['modern', 'minimal', 'premium', 'bold'];
const VALID_PALETTES = ['violet', 'saffron', 'emerald', 'rose', 'midnight'];

function validEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e || ''); }
function validPhone(p) { return (p || '').replace(/\D/g, '').length >= 10; }

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method not allowed' });
    }

    let body = req.body;
    if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch { return res.status(400).json({ error: 'Invalid JSON' }); }
    }
    const { idea, brand, theme, style, palette, plan, email, phone } = body || {};

    if (!idea || idea.length < 8)          return res.status(400).json({ error: 'Idea too short' });
    if (!VALID_THEMES.includes(theme))     return res.status(400).json({ error: 'Invalid theme' });
    if (!VALID_STYLES.includes(style))     return res.status(400).json({ error: 'Invalid style' });
    if (!VALID_PALETTES.includes(palette)) return res.status(400).json({ error: 'Invalid palette' });
    if (!PLANS[plan])                       return res.status(400).json({ error: 'Invalid plan' });
    if (!validEmail(email))                 return res.status(400).json({ error: 'Invalid email' });
    if (!validPhone(phone))                 return res.status(400).json({ error: 'Invalid phone' });

    const amount = PLANS[plan];
    const supabase = getSupabase();

    // 1. Insert pending order (DB generates UUID for id)
    const { data: inserted, error: insertErr } = await supabase
        .from('orders')
        .insert({
            plan, amount_inr: amount, status: 'pending',
            idea, brand: brand || null, theme,
            style_key: style, palette_key: palette,
            email, phone, source: 'cashfree'
        })
        .select('id')
        .single();

    if (insertErr) {
        console.error('[cashfree.create-order] insert failed:', insertErr);
        return res.status(500).json({ error: 'DB insert failed', detail: insertErr.message });
    }

    const orderId = inserted.id;

    // 2. Determine absolute origin for return_url / notify_url
    const proto = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const origin = `${proto}://${host}`;

    // 3. Create Cashfree order. We use our UUID as the Cashfree order_id.
    try {
        const cf = await createCashfreeOrder({
            orderId,
            amountInr: amount,
            customer: {
                id: `cust_${orderId.slice(0, 8)}`,
                name: (brand || email.split('@')[0]).slice(0, 50),
                email,
                phone: phone.replace(/\D/g, '').slice(-10)
            },
            returnUrl: `${origin}/success?order=${orderId}`,
            notifyUrl: `${origin}/api/cashfree/webhook`
        });

        // 4. Save cashfree_order_id on our order row
        await supabase.from('orders')
            .update({ cashfree_order_id: cf.order_id, updated_at: new Date().toISOString() })
            .eq('id', orderId);

        return res.status(200).json({
            ok: true,
            orderId,
            paymentSessionId: cf.payment_session_id,
            mode: cashfreeMode() === 'PROD' ? 'production' : 'sandbox',
            amount
        });
    } catch (err) {
        console.error('[cashfree.create-order] cashfree failed:', err, err?.detail);
        await supabase.from('orders')
            .update({ status: 'failed', error_message: err.message, updated_at: new Date().toISOString() })
            .eq('id', orderId);
        return res.status(502).json({ error: 'Cashfree order creation failed', detail: err.message });
    }
}
