# Stripe Integration Setup Guide

## 🚨 Current Issue
Customer payments are going through Stripe successfully, but webhooks aren't reaching the local development server, so user accounts aren't being updated.

## 🔧 Required Setup Steps

### 1. Get Your Stripe Keys
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Navigate to **Developers > API Keys**
3. Copy your **Secret Key** (starts with `sk_test_`)
4. Update `.env.local`:
   ```
   STRIPE_SECRET_KEY="sk_test_YOUR_ACTUAL_KEY_HERE"
   ```

### 2. Install Stripe CLI for Webhooks
```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login to your Stripe account
stripe login

# Forward webhooks to your local development server
stripe listen --forward-to localhost:3000/api/stripe/webhooks
```

This command will:
- Give you a webhook secret (starts with `whsec_`)
- Forward all Stripe events to your local server
- Show webhook events in real-time

### 3. Update Webhook Secret
When you run `stripe listen`, it will output something like:
```
> Ready! Your webhook signing secret is whsec_1234567890abcdef...
```

Copy this secret and update `.env.local`:
```
STRIPE_WEBHOOK_SECRET="whsec_1234567890abcdef"
```

### 4. Create Products and Prices in Stripe
1. Go to **Products** in Stripe Dashboard
2. Create products for each subscription plan:
   - **Entry Plan**: $24/month, 15 credits
   - **Showcase Plan**: $32/month, 25 credits  
   - **Prime Plan**: $49/month, 50 credits
   - **Prestige Plan**: $89/month, 100 credits
   - **Portfolio Plan**: $149/month, 300 credits

3. Create one-time credit pack products:
   - **5 Credit Pack**: $15
   - **10 Credit Pack**: $27
   - **20 Credit Pack**: $45
   - **50 Credit Pack**: $105

4. Copy the Price IDs (start with `price_`) and update `.env.local`

### 5. Test the Integration
1. Make sure `stripe listen` is running
2. Go to billing page and upgrade/purchase credits
3. Check the Stripe CLI output - you should see webhook events
4. Check your application - credits and plans should update immediately

## 🔍 Debugging Webhook Issues

### Check if webhooks are being received:
```bash
# In your stripe listen terminal, you should see:
[200] POST /api/stripe/webhooks [evt_1234567890]
```

### Check server logs:
```bash
# Your npm run dev terminal should show:
web:dev: Created subscription sub_1234567890 for user xyz with 15 credits
```

### If webhooks aren't working:
1. Verify `stripe listen` is running and shows events
2. Check `.env.local` has correct `STRIPE_WEBHOOK_SECRET`
3. Restart your development server after updating environment variables
4. Check for any errors in webhook handler at `/api/stripe/webhooks`

## 📋 Production Deployment

For production, instead of `stripe listen`:
1. Set up a public webhook endpoint in Stripe Dashboard
2. Point it to `https://yourdomain.com/api/stripe/webhooks`
3. Use the webhook secret from the dashboard (not from CLI)
4. Select these events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

## ✅ Verification Checklist
- [ ] Stripe CLI installed and logged in
- [ ] `stripe listen` running and forwarding to localhost:3000
- [ ] Real Stripe secret key in `.env.local`
- [ ] Webhook secret from CLI in `.env.local`
- [ ] Products and prices created in Stripe Dashboard
- [ ] Price IDs updated in `.env.local`
- [ ] Test purchase shows webhook events in CLI
- [ ] Test purchase updates user account immediately