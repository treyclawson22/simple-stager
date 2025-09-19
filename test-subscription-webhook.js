const { PrismaClient } = require('@prisma/client')

async function testSubscriptionWebhook() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: 'postgresql://postgres:zQViwzixCJlzFQDxeIxWOmsWMpkCDYya@crossover.proxy.rlwy.net:28966/railway'
      }
    }
  })

  try {
    const userId = 'cmfoa847l00009fqoxyacblmu'
    const planId = 'entry'
    const credits = 15
    const subscriptionId = 'sub_1S8uchGii48xiWlxBSMAfnme'

    console.log('🧪 Testing subscription webhook logic...')
    console.log('User ID:', userId)
    console.log('Plan ID:', planId)
    console.log('Credits:', credits)
    console.log('Subscription ID:', subscriptionId)

    // Test the upsert logic that's in the webhook
    console.log('\n🔄 Testing plan upsert...')
    const plan = await prisma.plan.upsert({
      where: { 
        userId_name: {
          userId,
          name: planId
        }
      },
      update: {
        stripeSubscriptionId: subscriptionId,
        status: 'active',
        currentPeriodStart: new Date(1758251075 * 1000),
        currentPeriodEnd: new Date(1760843075 * 1000),
      },
      create: {
        userId,
        name: planId,
        stripeSubscriptionId: subscriptionId,
        status: 'active',
        currentPeriodStart: new Date(1758251075 * 1000),
        currentPeriodEnd: new Date(1760843075 * 1000),
      }
    })
    console.log('✅ Plan upsert successful:', plan)

    // Test credit addition
    console.log('\n💳 Testing credit addition...')
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        credits: {
          increment: credits
        }
      }
    })
    console.log('✅ Credits added. New total:', updatedUser.credits)

    // Test credit ledger entry
    console.log('\n📝 Testing credit ledger entry...')
    const ledgerEntry = await prisma.creditLedger.create({
      data: {
        userId,
        delta: credits,
        reason: 'subscription',
        meta: JSON.stringify({
          stripeSubscriptionId: subscriptionId,
          planId,
          period: 'initial'
        })
      }
    })
    console.log('✅ Ledger entry created:', ledgerEntry.id)

    console.log('\n🎉 Subscription webhook logic test completed successfully!')

  } catch (error) {
    console.error('❌ Webhook logic failed:', error)
    console.error('Stack:', error.stack)
  } finally {
    await prisma.$disconnect()
  }
}

testSubscriptionWebhook()