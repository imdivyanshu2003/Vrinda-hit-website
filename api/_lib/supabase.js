// ============================================================
//  VRINDA HIT — Supabase client (server-side)
//  Uses SERVICE ROLE key so API routes can bypass RLS.
//  NEVER expose the service role key to the browser.
// ============================================================

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
export const SITES_BUCKET = process.env.SUPABASE_SITES_BUCKET || 'sites';

let _client = null;

export function getSupabase() {
    if (_client) return _client;
    if (!SUPABASE_URL || !SERVICE_KEY) {
        throw new Error('Supabase env vars missing: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel.');
    }
    _client = createClient(SUPABASE_URL, SERVICE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false }
    });
    return _client;
}
