const { PrismaClient } = require('@simple-stager/database')

const prisma = new PrismaClient()

async function fixUserPlan() {
  try {
    // Find the user (assuming you're the only authenticated user)
    const users = await prisma.user.findMany({
      include: { 
        plans: true,
        creditLedger: true
      }
    })
    
    console.log('Current users:', JSON.stringify(users, null, 2))
    
    if (users.length > 0) {
      const user = users.find(u => u.email === 'treyclawson@gmail.com') || users[0]
      
      console.log(`\nFixing plan for user: ${user.email}`)
      
      // Create Entry plan subscription
      const plan = await prisma.plan.create({
        data: {
          userId: user.id,
          name: 'entry',
          status: 'active',
          stripeSubscriptionId: 'manual_fix_' + Date.now(),
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        }
      })
      
      console.log('Created plan:', plan)
      
      // Add Entry plan credits (15 credits)
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          credits: {
            increment: 15
          }
        }
      })
      
      console.log('Updated user credits:', updatedUser.credits)
      
      // Add credit ledger entry
      const ledgerEntry = await prisma.creditLedger.create({
        data: {
          userId: user.id,
          delta: 15,
          reason: 'subscription',
          meta: JSON.stringify({
            planId: 'entry',
            period: 'initial',
            note: 'Manual fix for Entry plan subscription'
          })
        }
      })
      
      console.log('Created ledger entry:', ledgerEntry)
      console.log('\n✅ Successfully fixed user plan!')
    }
    
  } catch (error) {
    console.error('Error fixing plan:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixUserPlan()