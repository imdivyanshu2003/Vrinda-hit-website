// ============================================================
//  POST /api/trigger-generate  { orderId }
//  Called by the /success page once Cashfree payment is confirmed.
//  - Verifies the order is paid (via DB, fallback: Cashfree API)
//  - Runs generateSite()
//  - Marks order as 'generated' with slug
// Idempotent: if already generated, returns existing slug.
// ============================================================

import { getSupabase } from './_lib/supabase.js';
import { generateSite } from './_lib/generate-site.js';
import { fetchCashfreeOrder } from './_lib/cashfree.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method not allowed' });
    }

    let body = req.body;
    if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch { return res.status(400).json({ error: 'Invalid JSON' }); }
    }
    const { orderId } = body || {};
    if (!orderId) return res.status(400).json({ error: 'Missing orderId' });

    const supabase = getSupabase();

    const { data: order, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();
    if (error || !order) return res.status(404).json({ error: 'Order not found' });

    // Already generated → return current state (idempotent)
    if (order.status === 'generated' && order.slug) {
        return res.status(200).json({
            ok: true, already: true,
            slug: order.slug,
            url: `https://vrindahitwebsite.com/s/${order.slug}`
        });
    }

    // If webhook hasn't arrived yet, fall back to Cashfree API to confirm payment
    if (order.status !== 'paid') {
        try {
            const cf = await fetchCashfreeOrder(order.cashfree_order_id || orderId);
            if (cf.order_status === 'PAID') {
                await supabase.from('orders')
                    .update({ status: 'paid', updated_at: new Date().toISOString() })
                    .eq('id', orderId);
                order.status = 'paid';
            }
        } catch (e) {
            console.warn('[trigger-generate] cashfree fallback failed:', e?.message);
        }
    }

    if (order.status !== 'paid') {
        return res.status(402).json({ error: 'Payment not confirmed yet', status: order.status });
    }

    try {
        const result = await generateSite({
            idea: order.idea,
            brand: order.brand,
            theme: order.theme,
            style: order.style_key,
            palette: order.palette_key,
            plan: order.plan,
            email: order.email,
            phone: order.phone,
            orderId
        });
        return res.status(200).json({ ok: true, ...result });
    } catch (err) {
        console.error('[trigger-generate] failed:', err);
        await supabase.from('orders')
            .update({ error_message: err.message || String(err), updated_at: new Date().toISOString() })
            .eq('id', orderId);
        return res.status(500).json({
            error: err.message || 'Generation failed',
            code: err.code || 'unknown',
            detail: err.detail || null
        });
    }
}
