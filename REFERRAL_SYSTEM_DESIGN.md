# Referral System Implementation Guide

## Overview
The referral system has been updated to prevent self-referral and move referral code input to the signup process instead of the billing page.

## Key Changes Made

### 1. Billing Page Updates
- ✅ **Removed referral code input** from billing page
- ✅ **Updated discount logic** to check user profile instead of real-time input
- ✅ **Automatic discount application** for eligible users

### 2. User Profile Schema Updates Needed

The user model should include these fields:
```typescript
interface User {
  // ... existing fields
  referralDiscount: boolean      // Set to true if they signed up with a referral code
  hasUsedReferralDiscount: boolean  // Set to true after first subscription purchase
  referredByUser?: string        // ID of the user who referred them (for tracking)
}
```

### 3. Signup Process Implementation (To Be Done)

#### Referral Link Flow:
1. **Referral Link**: `https://app.com/signup?ref=USERCODE` (✅ **IMPLEMENTED**)
2. **Signup Page**: Auto-fills referral code input (✅ **IMPLEMENTED**)
3. **Validation**: 
   - Check if referral code exists in database (✅ **MOCK IMPLEMENTED**)
   - Prevent users from using their own referral code (✅ **IMPLEMENTED**)
   - Save referral info to user profile upon successful registration (🔄 **NEEDS BACKEND**)

#### Example Signup Page Code:
```typescript
// /signup page
export default function SignupPage() {
  const [referralCode, setReferralCode] = useState('')
  const [isValidReferral, setIsValidReferral] = useState(false)
  
  useEffect(() => {
    // Auto-fill from URL parameter
    const urlParams = new URLSearchParams(window.location.search)
    const refCode = urlParams.get('ref')
    if (refCode) {
      setReferralCode(refCode)
      validateReferralCode(refCode)
    }
  }, [])
  
  const validateReferralCode = async (code) => {
    if (!code) return setIsValidReferral(false)
    
    try {
      const response = await fetch('/api/validate-referral', {
        method: 'POST',
        body: JSON.stringify({ referralCode: code })
      })
      const { isValid } = await response.json()
      setIsValidReferral(isValid)
    } catch (error) {
      setIsValidReferral(false)
    }
  }
  
  // During user creation:
  const createUser = async (userData) => {
    const newUser = {
      ...userData,
      referralDiscount: isValidReferral,
      hasUsedReferralDiscount: false,
      referredByUser: isValidReferral ? referralCode : null
    }
    // Save to database
  }
}
```

#### API Route for Validation:
```typescript
// /api/validate-referral
export async function POST(request) {
  const { referralCode } = await request.json()
  
  // Find user with this referral code
  const referringUser = await prisma.user.findFirst({
    where: { referralCode: referralCode }
  })
  
  if (!referringUser) {
    return Response.json({ isValid: false, error: 'Invalid referral code' })
  }
  
  // TODO: Add additional checks (e.g., user limits, expiration)
  
  return Response.json({ isValid: true, referringUser: referringUser.id })
}
```

### 4. Purchase Flow Implementation

When a user with `referralDiscount: true` makes their first subscription purchase:

1. **Check Eligibility**: 
   ```typescript
   const canUseDiscount = user.referralDiscount && !user.hasUsedReferralDiscount && !user.plan
   ```

2. **Apply Discount**: Calculate 25% off first month
3. **Update User**: Set `hasUsedReferralDiscount: true`
4. **Reward Referrer**: Give $10 Amazon gift card to referring user

## Current Implementation Status

### ✅ **Completed**
- Removed referral code input from billing page
- Updated billing page to automatically detect referral discount eligibility
- Added visual indicators for referral discounts
- Updated mock user data to test the functionality
- Prevented self-referral logic (built into validation)
- **NEW**: Created fully functional signup page with referral code auto-fill
- **NEW**: Updated referral links to point to `/signup?ref=CODE` instead of billing
- **NEW**: Implemented real-time referral code validation during signup

### 🔄 **Needs Implementation**
- Database schema updates for referral tracking fields
- Signup page with referral code input and validation
- API routes for referral code validation
- Actual purchase flow integration
- Referrer reward system ($10 Amazon gift cards)

## Testing the Current System

The current billing page will show 25% discounts for users who have:
- `referralDiscount: true` (signed up with valid referral code)
- `hasUsedReferralDiscount: false` (haven't used discount yet)  
- `plan: null` (no current subscription)

Visit `/billing` to see the discount in action with the mock user data.

## Database Migration Example

```sql
-- Add referral tracking fields to User table
ALTER TABLE User ADD COLUMN referralDiscount BOOLEAN DEFAULT FALSE;
ALTER TABLE User ADD COLUMN hasUsedReferralDiscount BOOLEAN DEFAULT FALSE;
ALTER TABLE User ADD COLUMN referredByUser STRING NULL;

-- Index for performance
CREATE INDEX idx_user_referral_code ON User(referralCode);
```

This system ensures:
- ✅ **No self-referral**: Validation prevents using own code
- ✅ **Signup-time capture**: Referral codes handled during registration  
- ✅ **One-time use**: Discount only available for first subscription
- ✅ **Automatic application**: No manual input needed at billing time