// ============================================================
//  POST /api/generate — thin wrapper over generateSite() helper.
//  Used for manual / admin / test generations. For real customer
//  flow, /api/trigger-generate is called after Cashfree payment.
// ============================================================

import { generateSite } from './_lib/generate-site.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const secret = process.env.INTERNAL_API_SECRET;
    if (secret && req.headers['x-internal-secret'] !== secret) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    let body = req.body;
    if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch { return res.status(400).json({ error: 'Invalid JSON body' }); }
    }

    try {
        const result = await generateSite(body || {});
        return res.status(200).json({ ok: true, ...result });
    } catch (err) {
        console.error('[generate] error:', err);
        const code = err.code || 'unknown';
        const status = code === 'validation' ? 400
            : code === 'no_api_key' ? 500
            : code === 'claude_empty' ? 502
            : 500;
        return res.status(status).json({
            error: err.message || 'Generation failed',
            code,
            detail: err.detail || null
        });
    }
}
