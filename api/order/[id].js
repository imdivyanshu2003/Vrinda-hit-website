// ============================================================
//  GET /api/order/:id
//  Returns { status, slug, url, error } for the /success page to poll.
// ============================================================

import { getSupabase } from '../_lib/supabase.js';

export default async function handler(req, res) {
    const id = req.query.id;
    if (!id) return res.status(400).json({ error: 'Missing id' });

    const supabase = getSupabase();
    const { data, error } = await supabase
        .from('orders')
        .select('id, status, slug, error_message, plan, amount_inr, created_at')
        .eq('id', id)
        .single();

    if (error || !data) return res.status(404).json({ error: 'Not found' });

    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({
        ok: true,
        id: data.id,
        status: data.status,
        slug: data.slug || null,
        url: data.slug ? `https://vrindahitwebsite.com/s/${data.slug}` : null,
        error: data.error_message || null,
        plan: data.plan,
        amount: data.amount_inr,
        createdAt: data.created_at
    });
}
