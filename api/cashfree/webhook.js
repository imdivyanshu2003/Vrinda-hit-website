// ============================================================
//  POST /api/cashfree/webhook
//  Cashfree calls this on payment state changes. We verify HMAC,
//  flip the matching orders row to `paid`, and store payment IDs.
//  Actual site generation is triggered by /api/trigger-generate
//  from the /success page (keeps webhook fast & retriable).
// ============================================================

import { getSupabase } from '../_lib/supabase.js';
import { verifyWebhookSignature } from '../_lib/cashfree.js';

// Vercel: we need the raw body to verify HMAC. Disable auto JSON parsing.
export const config = { api: { bodyParser: false } };

function readRawBody(req) {
    return new Promise((resolve, reject) => {
        let data = '';
        req.on('data', chunk => { data += chunk; });
        req.on('end', () => resolve(data));
        req.on('error', reject);
    });
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method not allowed' });
    }

    let rawBody;
    try { rawBody = await readRawBody(req); }
    catch (e) { return res.status(400).json({ error: 'Cannot read body' }); }

    const signature = req.headers['x-webhook-signature'];
    const timestamp = req.headers['x-webhook-timestamp'];

    // Accept only signed requests (skip in TEST only if explicitly configured)
    const ok = verifyWebhookSignature({ rawBody, timestamp, signature });
    if (!ok) {
        console.warn('[cashfree.webhook] bad signature');
        return res.status(401).json({ error: 'Invalid signature' });
    }

    let event;
    try { event = JSON.parse(rawBody); }
    catch { return res.status(400).json({ error: 'Invalid JSON' }); }

    const type = event.type || event.event;
    const data = event.data || {};
    const orderInfo = data.order || {};
    const paymentInfo = data.payment || {};
    const cfOrderId = orderInfo.order_id;

    if (!cfOrderId) return res.status(200).json({ ok: true, ignored: 'no order_id' });

    const supabase = getSupabase();

    if (type === 'PAYMENT_SUCCESS_WEBHOOK') {
        const { error } = await supabase.from('orders')
            .update({
                status: 'paid',
                cashfree_payment_id: paymentInfo.cf_payment_id || paymentInfo.payment_id || null,
                updated_at: new Date().toISOString()
            })
            .eq('cashfree_order_id', cfOrderId)
            .in('status', ['pending', 'failed']); // don't overwrite already-generated
        if (error) {
            console.error('[cashfree.webhook] update failed:', error);
            return res.status(500).json({ error: 'DB update failed' });
        }
        return res.status(200).json({ ok: true });
    }

    if (type === 'PAYMENT_FAILED_WEBHOOK') {
        await supabase.from('orders')
            .update({
                status: 'failed',
                error_message: paymentInfo.payment_message || 'Payment failed',
                updated_at: new Date().toISOString()
            })
            .eq('cashfree_order_id', cfOrderId)
            .eq('status', 'pending');
        return res.status(200).json({ ok: true });
    }

    // Other events (refunds etc) — acknowledge and move on
    return res.status(200).json({ ok: true, ignored: type });
}
