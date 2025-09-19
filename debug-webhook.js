const { PrismaClient } = require('@prisma/client')

async function debugWebhook() {
  // Use the Railway production database
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: 'postgresql://postgres:zQViwzixCJlzFQDxeIxWOmsWMpkCDYya@crossover.proxy.rlwy.net:28966/railway'
      }
    }
  })

  try {
    console.log('🔍 Checking user cmfoa847l00009fqoxyacblmu...')
    
    const user = await prisma.user.findUnique({
      where: { id: 'cmfoa847l00009fqoxyacblmu' },
      include: {
        plans: true
      }
    })
    
    if (!user) {
      console.log('❌ User cmfoa847l00009fqoxyacblmu does NOT exist!')
      console.log('This is why the webhook fails - trying to create plan for non-existent user')
    } else {
      console.log('✅ User exists:', {
        id: user.id,
        email: user.email,
        credits: user.credits,
        plans: user.plans.length
      })
    }

    console.log('\n🔍 Checking all users with trey emails...')
    const treyUsers = await prisma.user.findMany({
      where: {
        email: {
          contains: 'trey'
        }
      },
      include: {
        plans: true
      }
    })

    treyUsers.forEach(user => {
      console.log(`📧 ${user.email} (${user.id}): ${user.credits} credits, ${user.plans.length} plans`)
    })

  } catch (error) {
    console.error('❌ Database error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

debugWebhook()