// ============================================================
//  VRINDA HIT — SERVE GENERATED SITE
//  GET /s/<slug>  (rewritten to /api/site/<slug> by vercel.json)
//  Streams the generated HTML stored in Vercel Blob.
// ============================================================

import { head } from '@vercel/blob';

export default async function handler(req, res) {
    const { slug } = req.query || {};

    if (!slug || typeof slug !== 'string' || !/^[a-z0-9-]{1,50}$/.test(slug)) {
        return send404(res, 'Invalid site identifier.');
    }

    try {
        // Look up the blob metadata. This does NOT download the file itself,
        // just tells us the public URL of the stored HTML.
        const pathname = `sites/${slug}.html`;
        let meta;
        try {
            meta = await head(pathname);
        } catch (e) {
            return send404(res, 'This website could not be found.');
        }

        if (!meta?.url) return send404(res, 'Storage returned no URL.');

        // Fetch the HTML from Blob storage and stream it back as the response.
        const upstream = await fetch(meta.url);
        if (!upstream.ok) {
            return send404(res, 'Site content is temporarily unavailable.');
        }
        const html = await upstream.text();

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=3600');
        res.setHeader('X-Vrinda-Slug', slug);
        return res.status(200).send(html);
    } catch (err) {
        console.error('[serve-site] error:', err);
        return send500(res, err);
    }
}

function send404(res, msg) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(404).send(`<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><title>Site not found — Vrinda Hit</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body{font-family:system-ui,-apple-system,sans-serif;background:linear-gradient(135deg,#0F0A1E,#4C1D95);color:#fff;min-height:100vh;display:flex;align-items:center;justify-content:center;margin:0;padding:24px;text-align:center}
  .box{max-width:440px}
  h1{font-size:2rem;margin:0 0 12px}
  p{opacity:.75;line-height:1.5}
  a{display:inline-block;margin-top:20px;padding:12px 24px;background:linear-gradient(135deg,#7C3AED,#EC4899);color:#fff;text-decoration:none;border-radius:12px;font-weight:600}
</style></head><body><div class="box">
<h1>🔍 Site not found</h1>
<p>${escapeHtml(msg)}</p>
<a href="https://vrindahitwebsite.com">← Build your own in 60 seconds</a>
</div></body></html>`);
}

function send500(res, err) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(500).send(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Error</title></head>
<body style="font-family:sans-serif;padding:40px"><h1>Something went wrong</h1>
<p>Our generation service had an error. Please contact support.</p>
<pre style="background:#f4f4f4;padding:12px;overflow:auto">${escapeHtml(err?.message || String(err))}</pre>
</body></html>`);
}

function escapeHtml(s) {
    return String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
