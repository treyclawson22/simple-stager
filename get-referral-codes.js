const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function getReferralCodes() {
  try {
    const users = await prisma.user.findMany({
      select: {
        email: true,
        referralCode: true,
        name: true
      },
      take: 3
    })
    
    console.log('User referral codes:')
    users.forEach(user => {
      console.log(`${user.email}: ${user.referralCode}`)
    })
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

getReferralCodes()