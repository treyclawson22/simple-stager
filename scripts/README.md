# SimpleStager Stripe Setup

This directory contains scripts to automate your Stripe billing setup.

## Quick Setup

### 1. Get your Stripe API key
- Go to [Stripe Dashboard](https://dashboard.stripe.com)
- Navigate to **Developers > API keys**
- Copy your **Secret key** (starts with `sk_test_...` for test mode)

### 2. Run the setup script
```bash
# From the project root directory
STRIPE_SECRET_KEY=sk_test_your_key_here node scripts/setup-stripe.js
```

### 3. Copy the output to your environment file
The script will output environment variables - copy them to `apps/web/.env.local`:

```bash
# Stripe Configuration  
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Subscription Plan Price IDs
STRIPE_ENTRY_PRICE_ID="price_..."
STRIPE_SHOWCASE_PRICE_ID="price_..."
STRIPE_PRIME_PRICE_ID="price_..."
STRIPE_PRESTIGE_PRICE_ID="price_..."
STRIPE_PORTFOLIO_PRICE_ID="price_..."

# Credit Pack Price IDs
STRIPE_PACK_5_PRICE_ID="price_..."
STRIPE_PACK_10_PRICE_ID="price_..."
STRIPE_PACK_20_PRICE_ID="price_..."
STRIPE_PACK_50_PRICE_ID="price_..."
```

## What the script creates

### Subscription Products
- **Entry Plan**: $24/month, 15 credits
- **Showcase Plan**: $32/month, 25 credits  
- **Prime Plan**: $49/month, 50 credits
- **Prestige Plan**: $89/month, 100 credits
- **Portfolio Plan**: $149/month, 300 credits

### One-time Credit Packs
- **5 Credits**: $15 ($3.00 per credit)
- **10 Credits**: $27 ($2.70 per credit)
- **20 Credits**: $45 ($2.25 per credit)
- **50 Credits**: $105 ($2.10 per credit)

### Webhook Endpoint
- Automatically configured for `https://app.simplestager.com/api/stripe/webhooks`
- Handles subscription events and payment notifications

## Testing vs Production

### Test Mode
- Use test API keys (`sk_test_...`)
- Use test credit cards (4242424242424242)
- No real money is charged

### Production Mode  
- Use live API keys (`sk_live_...`)
- Real payments will be processed
- Run the script again with live keys when ready

## Troubleshooting

**Script fails with "Invalid API key"**
- Double-check your STRIPE_SECRET_KEY
- Make sure it starts with `sk_test_` or `sk_live_`

**Webhook creation fails**
- Make sure your domain is accessible
- For local testing, use ngrok or similar tunnel

**Products already exist**
- Delete existing products in Stripe Dashboard first
- Or modify the script to update instead of create

## Support

If you encounter issues:
1. Check the Stripe Dashboard for created products
2. Verify your API keys are correct
3. Check the Stripe logs for webhook events
4. Test with Stripe's test credit cards