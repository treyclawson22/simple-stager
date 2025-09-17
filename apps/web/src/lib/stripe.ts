import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-09-30.acacia',
  appInfo: {
    name: 'SimpleStager',
    version: '1.0.0',
  },
})

// Subscription plan configuration
export const SUBSCRIPTION_PLANS = {
  entry: {
    name: 'Entry',
    price: 24,
    credits: 15,
    stripePriceId: process.env.STRIPE_ENTRY_PRICE_ID || '',
  },
  showcase: {
    name: 'Showcase', 
    price: 32,
    credits: 25,
    stripePriceId: process.env.STRIPE_SHOWCASE_PRICE_ID || '',
  },
  prime: {
    name: 'Prime',
    price: 49,
    credits: 50,
    stripePriceId: process.env.STRIPE_PRIME_PRICE_ID || '',
  },
  prestige: {
    name: 'Prestige',
    price: 89,
    credits: 100,
    stripePriceId: process.env.STRIPE_PRESTIGE_PRICE_ID || '',
  },
  portfolio: {
    name: 'Portfolio',
    price: 149,
    credits: 300,
    stripePriceId: process.env.STRIPE_PORTFOLIO_PRICE_ID || '',
  },
} as const

// One-time credit pack configuration
export const CREDIT_PACKS = {
  pack_5: {
    credits: 5,
    price: 15,
    stripePriceId: process.env.STRIPE_PACK_5_PRICE_ID || '',
  },
  pack_10: {
    credits: 10,
    price: 27,
    stripePriceId: process.env.STRIPE_PACK_10_PRICE_ID || '',
  },
  pack_20: {
    credits: 20,
    price: 45,
    stripePriceId: process.env.STRIPE_PACK_20_PRICE_ID || '',
  },
  pack_50: {
    credits: 50,
    price: 105,
    stripePriceId: process.env.STRIPE_PACK_50_PRICE_ID || '',
  },
} as const

export type SubscriptionPlanId = keyof typeof SUBSCRIPTION_PLANS
export type CreditPackId = keyof typeof CREDIT_PACKS