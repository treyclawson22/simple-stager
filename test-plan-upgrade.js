const { PrismaClient } = require('@prisma/client')

async function testPlanUpgrade() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: 'postgresql://postgres:zQViwzixCJlzFQDxeIxWOmsWMpkCDYya@crossover.proxy.rlwy.net:28966/railway'
      }
    }
  })

  try {
    const userId = 'cmfoa847l00009fqoxyacblmu'
    const subscriptionId = 'sub_1S8ukpGii48xiWlxqKVrrHvb' // New showcase subscription
    const newPlanId = 'showcase'
    const newCredits = 25 // Showcase plan credits

    console.log('🧪 Testing plan upgrade logic...')
    console.log('User ID:', userId)
    console.log('Subscription ID:', subscriptionId)
    console.log('New Plan:', newPlanId)
    console.log('New Credits:', newCredits)

    // Check current state
    console.log('\n📊 Current state:')
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { plans: true }
    })
    console.log('User credits:', currentUser.credits)
    console.log('Current plans:', currentUser.plans)

    // Find existing plan for this subscription
    const existingPlan = await prisma.plan.findFirst({
      where: { 
        userId,
        stripeSubscriptionId: subscriptionId
      }
    })

    if (!existingPlan) {
      console.log('❌ No existing plan found for this subscription')
      
      // Look for plans with the old subscription ID
      const oldPlan = await prisma.plan.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      })
      
      if (oldPlan) {
        console.log('🔄 Found old plan, updating subscription ID:', oldPlan)
        
        // Update the old plan with new subscription ID and plan type
        await prisma.plan.update({
          where: { id: oldPlan.id },
          data: {
            name: newPlanId,
            stripeSubscriptionId: subscriptionId,
            status: 'active',
            currentPeriodStart: new Date(1758251579 * 1000),
            currentPeriodEnd: new Date(1760843579 * 1000),
          }
        })

        console.log('✅ Plan updated to Showcase')
      }
    } else {
      console.log('✅ Found existing plan:', existingPlan)
      
      if (existingPlan.name !== newPlanId) {
        console.log(`🔄 Plan upgrade: ${existingPlan.name} → ${newPlanId}`)
        
        await prisma.plan.update({
          where: { id: existingPlan.id },
          data: {
            name: newPlanId,
            status: 'active',
            currentPeriodStart: new Date(1758251579 * 1000),
            currentPeriodEnd: new Date(1760843579 * 1000),
          }
        })
        
        console.log('✅ Plan updated')
      }
    }

    // Add credits for showcase plan
    console.log('\n💳 Adding Showcase plan credits...')
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        credits: {
          increment: newCredits
        }
      }
    })
    console.log('✅ Credits added. New total:', updatedUser.credits)

    // Add ledger entry
    await prisma.creditLedger.create({
      data: {
        userId,
        delta: newCredits,
        reason: 'subscription_upgrade',
        meta: JSON.stringify({
          stripeSubscriptionId: subscriptionId,
          newPlan: newPlanId,
          period: 'upgrade'
        })
      }
    })

    console.log('✅ Ledger entry created')
    console.log('\n🎉 Plan upgrade test completed successfully!')

  } catch (error) {
    console.error('❌ Plan upgrade test failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testPlanUpgrade()