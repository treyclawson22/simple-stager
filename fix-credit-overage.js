const { PrismaClient } = require('@prisma/client')

async function fixCreditOverage() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: 'postgresql://postgres:zQViwzixCJlzFQDxeIxWOmsWMpkCDYya@crossover.proxy.rlwy.net:28966/railway'
      }
    }
  })

  try {
    const userId = 'cmfoa847l00009fqoxyacblmu'

    console.log('🔧 Fixing credit overage from plan upgrade...')
    
    // Check current state
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { 
        plans: true,
        creditLedger: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    })
    
    console.log('Current state:')
    console.log('- Credits:', currentUser.credits)
    console.log('- Plan:', currentUser.plans[0]?.name)
    console.log('- Recent ledger entries:', currentUser.creditLedger.map(l => `${l.reason}: ${l.delta}`))

    // The issue: User should have gotten 10 credits (25-15) but got 25 credits
    // Current credits: 47 (22 + 25)
    // Should be: 32 (22 + 10)
    // Need to subtract: 15 credits

    const overageAmount = 15 // 25 credits given - 10 credits should have been given
    
    console.log(`\n🔄 Removing ${overageAmount} excess credits...`)
    
    // Remove excess credits
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        credits: {
          decrement: overageAmount
        }
      }
    })

    // Add corrective ledger entry
    await prisma.creditLedger.create({
      data: {
        userId,
        delta: -overageAmount,
        reason: 'admin_correction',
        meta: JSON.stringify({
          correction: 'Fixed plan upgrade overage',
          originalUpgrade: 'entry_to_showcase',
          shouldHaveReceived: 10,
          actuallyReceived: 25,
          correctionAmount: -overageAmount
        })
      }
    })

    console.log('✅ Credit overage fixed')
    console.log('New credit total:', updatedUser.credits)
    console.log('\nCorrect credit flow:')
    console.log('- Started with Entry plan: +15 credits')
    console.log('- Bought 5-credit pack: +5 credits = 20 total')
    console.log('- Had some existing: 2 credits = 22 total')
    console.log('- Upgraded Entry→Showcase: +10 credits (25-15) = 32 total')
    console.log('- Current should be: 32 credits')

  } catch (error) {
    console.error('❌ Fix failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixCreditOverage()