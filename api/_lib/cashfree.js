// ============================================================
//  VRINDA HIT — Cashfree helper (Orders API v3)
//  Docs: https://www.cashfree.com/docs/payments/online/api-reference/payment-gateway/v3/orders/create-order
// ============================================================

import crypto from 'crypto';

const API_VERSION = '2023-08-01';

function env() {
    const mode = (process.env.CASHFREE_MODE || 'TEST').toUpperCase(); // TEST | PROD
    const appId = process.env.CASHFREE_APP_ID;
    const secret = process.env.CASHFREE_SECRET_KEY;
    if (!appId || !secret) throw new Error('CASHFREE_APP_ID / CASHFREE_SECRET_KEY not set');
    const base = mode === 'PROD' ? 'https://api.cashfree.com/pg' : 'https://sandbox.cashfree.com/pg';
    return { mode, appId, secret, base };
}

export function cashfreeMode() {
    return (process.env.CASHFREE_MODE || 'TEST').toUpperCase();
}

/** Create a Cashfree order. Returns { payment_session_id, order_id, ...raw }. */
export async function createCashfreeOrder({ orderId, amountInr, customer, returnUrl, notifyUrl }) {
    const { appId, secret, base } = env();
    const payload = {
        order_id: orderId,
        order_amount: Number(amountInr),
        order_currency: 'INR',
        customer_details: {
            customer_id: customer.id,
            customer_name: customer.name || 'Customer',
            customer_email: customer.email,
            customer_phone: customer.phone
        },
        order_meta: {
            return_url: returnUrl,   // Cashfree appends ?order_id=... automatically
            notify_url: notifyUrl
        }
    };

    const resp = await fetch(`${base}/orders`, {
        method: 'POST',
        headers: {
            'x-api-version': API_VERSION,
            'x-client-id': appId,
            'x-client-secret': secret,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });
    const data = await resp.json();
    if (!resp.ok) {
        const err = new Error(data.message || 'Cashfree create-order failed');
        err.detail = data;
        throw err;
    }
    return data;
}

/** Fetch order status from Cashfree (used as webhook fallback). */
export async function fetchCashfreeOrder(orderId) {
    const { appId, secret, base } = env();
    const resp = await fetch(`${base}/orders/${encodeURIComponent(orderId)}`, {
        headers: {
            'x-api-version': API_VERSION,
            'x-client-id': appId,
            'x-client-secret': secret
        }
    });
    const data = await resp.json();
    if (!resp.ok) {
        const err = new Error(data.message || 'Cashfree fetch-order failed');
        err.detail = data;
        throw err;
    }
    return data; // has order_status: PAID | ACTIVE | EXPIRED ...
}

/**
 * Verify Cashfree webhook signature.
 * Cashfree sends: x-webhook-signature  and  x-webhook-timestamp
 * Signature = base64( HMAC_SHA256( timestamp + rawBody, SECRET_KEY ) )
 */
export function verifyWebhookSignature({ rawBody, timestamp, signature }) {
    const { secret } = env();
    if (!rawBody || !timestamp || !signature) return false;
    const mac = crypto.createHmac('sha256', secret);
    mac.update(String(timestamp) + rawBody);
    const expected = mac.digest('base64');
    try {
        return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
    } catch { return false; }
}
