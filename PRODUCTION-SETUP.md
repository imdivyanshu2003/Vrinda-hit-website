# 🚀 Production Setup Guide

## 1. Update Vercel Environment Variables

Go to your Vercel project → Settings → Environment Variables and update:

```
CASHFREE_MODE=PROD
CASHFREE_APP_ID=your_production_app_id_here
CASHFREE_SECRET_KEY=your_production_secret_key_here
```

Get production keys from: https://dashboard.cashfree.com/apikeys

## 2. Update Cashfree Webhook URL

In Cashfree Dashboard → Webhooks → Add/Update webhook:

**Production webhook URL:** `https://your-domain.com/api/cashfree/webhook`

Replace `your-domain.com` with your actual deployed domain.

## 3. Test Production Payment

1. Deploy changes to Vercel
2. Test with real payment (₹299 for Basic plan)
3. You can refund yourself in Cashfree Dashboard if needed

## 4. Monitor in Supabase

Run this query to see production orders:

```sql
select 
  id,
  status,
  plan,
  amount_inr,
  brand,
  idea,
  theme,
  email,
  slug,
  created_at
from orders 
where source = 'cashfree'
order by created_at desc 
limit 10;
```

## 5. Important Notes

- Test mode used ₹1 amounts, production uses real pricing
- Production payments are irreversible unless you refund manually
- All payment data is stored in Supabase `orders` table
- Webhook must be set to production URL for real payments

## 6. Rollback if Needed

If you need to switch back to test mode:

```
CASHFREE_MODE=TEST
CASHFREE_APP_ID=your_test_app_id_here
CASHFREE_SECRET_KEY=your_test_secret_key_here
```

And update webhook URL to your test domain.
