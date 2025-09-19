# PayPal Billing Integration - Setup Prompt for Claude

## Context Summary
I'm working on a Next.js 15 virtual staging application called Simple Stager. The app allows users to upload room photos and generate AI-staged images using Gemini 2.5 Flash. Users consume credits for downloads, and I need to implement PayPal billing for credit purchases.

## Current Application State
- **Framework**: Next.js 15 with TypeScript, Tailwind CSS, Prisma ORM
- **Database**: PostgreSQL with user credit system already implemented
- **Authentication**: NextAuth.js (some dashboard issues, but test page works)
- **Working URL**: `http://localhost:3000/test` (fully functional)
- **Credit System**: Users have credits, downloads consume 1 credit each

## Database Schema (Relevant)
```prisma
model User {
  id            String @id @default(cuid())
  email         String @unique
  name          String?
  credits       Int @default(0)
  referralCode  String @unique
  plan          Plan?
  workflows     Workflow[]
}

model Plan {
  id     String @id @default(cuid())
  name   String
  price  Decimal
  credits Int
  userId String @unique
  user   User @relation(fields: [userId], references: [id])
}
```

## PayPal Integration Requirements

### 1. **PayPal Setup Needed**
- PayPal Developer Account configuration
- Environment variables for PayPal client ID and secret
- Sandbox vs Production environment handling

### 2. **Credit Packages to Implement**
- **Starter Pack**: 10 credits for $9.99
- **Pro Pack**: 25 credits for $19.99  
- **Business Pack**: 100 credits for $49.99
- **Enterprise Pack**: 500 credits for $199.99

### 3. **Billing Page Enhancement**
Current billing page exists at `/app/(dashboard)/billing/page.tsx` but needs:
- Credit package selection UI
- PayPal payment button integration
- Purchase confirmation flow
- Transaction history with PayPal transaction IDs

### 4. **Technical Implementation Needed**
- PayPal JavaScript SDK integration
- API routes for payment processing
- Webhook handling for payment confirmation
- Database updates for successful purchases
- Error handling for failed payments

### 5. **Security Considerations**
- Payment verification on server-side
- Webhook signature validation
- Prevention of duplicate credit additions
- Secure transaction logging

## Files to Focus On
- `/app/(dashboard)/billing/page.tsx` - Main billing interface
- `/api/payments/` - New payment API routes needed
- Environment variables in `.env.local`
- Database migrations if needed for transaction tracking

## Current Environment
```bash
# Existing keys
ANTHROPIC_API_KEY=your-anthropic-api-key
GEMINI_API_KEY=your-gemini-api-key

# PayPal keys needed:
# PAYPAL_CLIENT_ID=
# PAYPAL_CLIENT_SECRET=
# PAYPAL_ENVIRONMENT=sandbox (or production)
```

## Request
Please help me implement PayPal billing integration for the Simple Stager credit system. I want to:

1. Set up PayPal Developer account and get the necessary credentials
2. Create a clean, professional billing page with credit package options
3. Implement secure payment processing with proper error handling
4. Add transaction tracking to the database
5. Test the full payment flow in sandbox mode

Start by reading the current billing page and understanding the existing credit system, then guide me through the PayPal setup process and implementation steps.

## Additional Context
- The application is for real estate virtual staging
- Users are real estate agents who need reliable, professional payment processing
- The current test user has 8 credits and the system is fully functional
- Focus on clean, professional UI that matches the existing Tailwind design
- Ensure proper error handling and user feedback throughout the payment process

Ready to implement PayPal billing integration - please start by examining the current billing page and proposing the implementation approach.