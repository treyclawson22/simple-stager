#!/usr/bin/env node

/**
 * SimpleStager Stripe Setup Script
 * 
 * This script automatically creates all the products and prices in your Stripe account
 * Run this once to set up your billing infrastructure
 * 
 * Prerequisites:
 * 1. Set your Stripe secret key in environment: STRIPE_SECRET_KEY=sk_test_... (or sk_live_...)
 * 2. Run: node scripts/setup-stripe.js
 */

const Stripe = require('stripe')

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('❌ Please set STRIPE_SECRET_KEY environment variable')
  console.log('Example: STRIPE_SECRET_KEY=sk_test_... node scripts/setup-stripe.js')
  process.exit(1)
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-09-30.acacia',
})

const subscriptionPlans = [
  {
    id: 'entry',
    name: 'Entry Plan',
    description: 'For new agents testing virtual staging',
    price: 24,
    credits: 15,
    interval: 'month'
  },
  {
    id: 'showcase', 
    name: 'Showcase Plan',
    description: 'Great for agents listing multiple homes',
    price: 32,
    credits: 25,
    interval: 'month'
  },
  {
    id: 'prime',
    name: 'Prime Plan',
    description: 'Best balance of value and volume',
    price: 49,
    credits: 50,
    interval: 'month'
  },
  {
    id: 'prestige',
    name: 'Prestige Plan', 
    description: 'For busy agents and boutique broker teams',
    price: 89,
    credits: 100,
    interval: 'month'
  },
  {
    id: 'portfolio',
    name: 'Portfolio Plan',
    description: 'Scales for high-volume brokerages and teams',
    price: 149,
    credits: 300,
    interval: 'month'
  }
]

const creditPacks = [
  {
    id: 'pack_5',
    name: '5 Credit Pack',
    description: 'Occasional use - 5 credits for staging photos',
    price: 15,
    credits: 5
  },
  {
    id: 'pack_10',
    name: '10 Credit Pack', 
    description: 'Good for single listings - 10 credits',
    price: 27,
    credits: 10
  },
  {
    id: 'pack_20',
    name: '20 Credit Pack',
    description: 'Flexible for mid-sized projects - 20 credits',
    price: 45,
    credits: 20
  },
  {
    id: 'pack_50',
    name: '50 Credit Pack',
    description: 'Bulk option without subscription - 50 credits',
    price: 105,
    credits: 50
  }
]

async function createSubscriptionPlans() {
  console.log('🔄 Creating subscription plans...')
  
  const results = {}
  
  for (const plan of subscriptionPlans) {
    try {
      // Create product
      const product = await stripe.products.create({
        name: plan.name,
        description: plan.description,
        metadata: {
          type: 'subscription',
          planId: plan.id,
          credits: plan.credits.toString()
        }
      })
      
      console.log(`✅ Created product: ${plan.name} (${product.id})`)
      
      // Create price
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: plan.price * 100, // Convert to cents
        currency: 'usd',
        recurring: {
          interval: plan.interval
        },
        metadata: {
          planId: plan.id,
          credits: plan.credits.toString()
        }
      })
      
      console.log(`💰 Created price: $${plan.price}/month (${price.id})`)
      
      results[`STRIPE_${plan.id.toUpperCase()}_PRICE_ID`] = price.id
      
    } catch (error) {
      console.error(`❌ Failed to create ${plan.name}:`, error.message)
    }
  }
  
  return results
}

async function createCreditPacks() {
  console.log('\\n🔄 Creating credit packs...')
  
  const results = {}
  
  for (const pack of creditPacks) {
    try {
      // Create product
      const product = await stripe.products.create({
        name: pack.name,
        description: pack.description,
        metadata: {
          type: 'credit_pack',
          packId: pack.id,
          credits: pack.credits.toString()
        }
      })
      
      console.log(`✅ Created product: ${pack.name} (${product.id})`)
      
      // Create price
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: pack.price * 100, // Convert to cents
        currency: 'usd',
        metadata: {
          packId: pack.id,
          credits: pack.credits.toString()
        }
      })
      
      console.log(`💰 Created price: $${pack.price} (${price.id})`)
      
      results[`STRIPE_${pack.id.toUpperCase()}_PRICE_ID`] = price.id
      
    } catch (error) {
      console.error(`❌ Failed to create ${pack.name}:`, error.message)
    }
  }
  
  return results
}

async function setupWebhook() {
  console.log('\\n🔄 Setting up webhook endpoint...')
  
  try {
    const webhook = await stripe.webhookEndpoints.create({
      url: 'https://app.simplestager.com/api/stripe/webhooks',
      enabled_events: [
        'checkout.session.completed',
        'customer.subscription.created',
        'customer.subscription.updated', 
        'customer.subscription.deleted',
        'invoice.payment_succeeded',
        'invoice.payment_failed'
      ]
    })
    
    console.log(`✅ Created webhook endpoint: ${webhook.url}`)
    console.log(`🔑 Webhook secret: ${webhook.secret}`)
    
    return {
      STRIPE_WEBHOOK_SECRET: webhook.secret
    }
    
  } catch (error) {
    console.error('❌ Failed to create webhook:', error.message)
    return {}
  }
}

async function main() {
  console.log('🚀 Setting up SimpleStager Stripe integration...')
  console.log(`🔑 Using Stripe account: ${process.env.STRIPE_SECRET_KEY.includes('live') ? 'LIVE' : 'TEST'}`)
  
  try {
    const subscriptionResults = await createSubscriptionPlans()
    const creditPackResults = await createCreditPacks()
    const webhookResults = await setupWebhook()
    
    const allResults = {
      ...subscriptionResults,
      ...creditPackResults,
      ...webhookResults
    }
    
    console.log('\\n🎉 Setup complete! Add these environment variables to your .env file:')
    console.log('\\n# Stripe Configuration')
    console.log(`STRIPE_SECRET_KEY="${process.env.STRIPE_SECRET_KEY}"`)
    console.log('STRIPE_PUBLISHABLE_KEY="pk_test_..."  # Get this from Stripe Dashboard')
    
    Object.entries(allResults).forEach(([key, value]) => {
      console.log(`${key}="${value}"`)
    })
    
    console.log('\\n📋 Next steps:')
    console.log('1. Copy the environment variables above to your .env.local file')
    console.log('2. Get your publishable key from Stripe Dashboard > Developers > API keys')
    console.log('3. Test the billing integration on your app')
    console.log('4. When ready for production, run this script again with your live keys')
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message)
    process.exit(1)
  }
}

main()