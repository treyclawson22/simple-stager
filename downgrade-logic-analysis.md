# Downgrade Business Logic Analysis

## Scenario: User downgrades Showcase (25 credits) → Entry (15 credits)

### Current Implementation (WRONG):
- Immediate: Remove 10 credits
- Next cycle: Add 15 credits (new plan amount)
- **Problem**: User loses credits they paid for

### Proposed Implementation (BETTER):
- Immediate: Keep all existing credits (no reduction)
- Next cycle: Add 15 credits (new plan amount)
- **Problem**: User gets more credits than they should

### Question: What should happen at next billing cycle?

**Option A: Add new plan credits regardless**
- User has 25 credits from Showcase
- Next month: Add 15 more credits (Entry plan)
- Total: 40 credits
- **Issue**: User gets more credits than Entry plan should provide

**Option B: Don't add any credits if they have excess**
- User has 25 credits from Showcase
- Next month: Check if credits > 15, if so, add 0
- Total: 25 credits (gradually consumed)
- **Issue**: User might never get monthly credits again

**Option C: Set credits to plan amount (reset approach)**
- User has 25 credits from Showcase
- Next month: Set credits to 15 (Entry plan amount)
- Total: 15 credits
- **Issue**: User loses credits they haven't used

**Option D: Add credits but cap at reasonable limit**
- User has 25 credits from Showcase
- Next month: Add 15 credits but cap total at 2x plan amount (30)
- Total: 30 credits
- **Balanced**: User gets credits but not unlimited accumulation

## Recommendation: Option D with documentation

### Implementation:
```typescript
// During monthly invoice.payment_succeeded for downgraded users
const planCredits = getCurrentPlanCredits(planId) // 15 for Entry
const maxCredits = planCredits * 2 // 30 for Entry
const currentCredits = user.credits // e.g., 25

if (currentCredits < maxCredits) {
  const creditsToAdd = Math.min(planCredits, maxCredits - currentCredits)
  // Add 5 credits (min of 15 plan credits or 30 max - 25 current)
} else {
  // User has enough credits, skip this month's allocation
}
```

### User Communication:
"You've downgraded to Entry plan. You'll keep your existing credits and receive monthly Entry plan credits (15) up to a reasonable limit."