const { PrismaClient } = require('@prisma/client')

async function debugSubscription() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: 'postgresql://postgres:zQViwzixCJlzFQDxeIxWOmsWMpkCDYya@crossover.proxy.rlwy.net:28966/railway'
      }
    }
  })

  try {
    console.log('🔍 Searching for Trey\'s user records...')
    
    // Find all users with 'trey' in email
    const users = await prisma.user.findMany({
      where: {
        email: {
          contains: 'trey',
          mode: 'insensitive'
        }
      },
      include: {
        plans: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    console.log(`\n📊 Found ${users.length} users:`)
    
    for (const user of users) {
      console.log(`\n👤 User: ${user.name} (${user.email})`)
      console.log(`   ID: ${user.id}`)
      console.log(`   Credits: ${user.credits}`)
      console.log(`   Plans (${user.plans.length}):`)
      
      if (user.plans.length === 0) {
        console.log(`     ❌ No plans found`)
      } else {
        for (const plan of user.plans) {
          console.log(`     📋 Plan: ${plan.name}`)
          console.log(`        Status: ${plan.status}`)
          console.log(`        Stripe Subscription ID: ${plan.stripeSubscriptionId || 'MISSING'}`)
          console.log(`        Created: ${plan.createdAt}`)
          console.log(`        Period: ${plan.currentPeriodStart} → ${plan.currentPeriodEnd}`)
          console.log(`        ---`)
        }
      }
    }

    // Check the specific query used in create-checkout
    console.log(`\n🔍 Testing the exact query from create-checkout...`)
    
    for (const user of users) {
      const activePlan = await prisma.plan.findFirst({
        where: { 
          userId: user.id,
          status: 'active'
        }
      })
      
      console.log(`\n🎯 User ${user.email} active plan query result:`)
      if (activePlan) {
        console.log(`   ✅ Found active plan: ${activePlan.name}`)
        console.log(`   ✅ Has Stripe ID: ${!!activePlan.stripeSubscriptionId}`)
        console.log(`   ✅ Stripe ID: ${activePlan.stripeSubscriptionId}`)
      } else {
        console.log(`   ❌ No active plan found`)
      }
    }

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

debugSubscription()