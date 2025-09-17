import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
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
    stripePriceId: 'price_1S8G8fGii48xiWlx6VEYhAxk', // Live mode - verified
  },
  showcase: {
    name: 'Showcase', 
    price: 32,
    credits: 25,
    stripePriceId: 'price_1S8G8vGii48xiWlxBwR1dUzy', // Live mode - verified
  },
  prime: {
    name: 'Prime',
    price: 49,
    credits: 50,
    stripePriceId: 'price_1S8G9HGii48xiWlxBlXRnY5r', // Live mode - verified
  },
  prestige: {
    name: 'Prestige',
    price: 89,
    credits: 100,
    stripePriceId: 'price_1S8G9HGii48xiWlx57XSEFb7', // Live mode - verified
  },
  portfolio: {
    name: 'Portfolio',
    price: 149,
    credits: 300,
    stripePriceId: 'price_1S8G9IGii48xiWlxe2X1TyaA', // Live mode - verified
  },
} as const

// Debug environment variables
console.log('🔍 STRIPE ENV DEBUG:')
console.log('STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY?.substring(0, 12) + '...')
console.log('STRIPE_PACK_5_PRICE_ID:', process.env.STRIPE_PACK_5_PRICE_ID)

// One-time credit pack configuration  
export const CREDIT_PACKS = {
  pack_5: {
    credits: 5,
    price: 15,
    stripePriceId: 'price_1S8G9fGii48xiWlxR0Rdtx0U', // Live mode - verified
  },
  pack_10: {
    credits: 10,
    price: 27,
    stripePriceId: 'price_1S8G9fGii48xiWlx7q0kNTZQ', // Live mode - verified
  },
  pack_20: {
    credits: 20,
    price: 45,
    stripePriceId: 'price_1S8G9gGii48xiWlx2i3hHjUL', // Live mode - verified
  },
  pack_50: {
    credits: 50,
    price: 105,
    stripePriceId: 'price_1S8G9gGii48xiWlxlKWUYBms', // Live mode - verified
  },
} as const

export type SubscriptionPlanId = keyof typeof SUBSCRIPTION_PLANS
export type CreditPackId = keyof typeof CREDIT_PACKS