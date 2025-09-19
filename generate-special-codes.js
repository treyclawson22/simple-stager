const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Generate a random special code
function generateSpecialCode() {
  const prefixes = ['VIP', 'ELITE', 'PLATINUM', 'PREMIUM', 'GOLD', 'DIAMOND', 'ROYAL', 'MASTER', 'PRIME', 'ULTRA']
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
  const numbers = Math.floor(Math.random() * 9000) + 1000 // 4-digit number
  return `${prefix}${numbers}`
}

async function generateSpecialCodes() {
  try {
    console.log('🎯 Generating 10 special referral codes...')
    
    const generatedCodes = []
    
    for (let i = 0; i < 10; i++) {
      let code = generateSpecialCode()
      let attempts = 0
      
      // Ensure code is unique
      while (attempts < 10) {
        const existing = await prisma.specialReferralCode.findUnique({
          where: { code }
        })
        
        if (!existing) break
        code = generateSpecialCode()
        attempts++
      }
      
      if (attempts >= 10) {
        console.error('❌ Failed to generate unique code')
        return
      }
      
      const savedCode = await prisma.specialReferralCode.create({
        data: {
          code,
          credits: 100,
          description: 'VIP Realtor Program',
          createdBy: 'admin'
        }
      })
      
      generatedCodes.push(savedCode)
      console.log(`✅ Generated: ${savedCode.code}`)
    }
    
    console.log('\n🎉 All 10 special referral codes generated successfully!')
    console.log('\n📝 Here are your VIP codes:')
    console.log('=' .repeat(50))
    
    generatedCodes.forEach((code, index) => {
      console.log(`${index + 1}. ${code.code} (100 credits)`)
    })
    
    console.log('=' .repeat(50))
    console.log('\n💡 Usage: Share these codes with VIP realtors')
    console.log('🔗 Signup URL format: https://app.simplestager.com/signup?ref=VIP1234')
    console.log('💎 Each code gives 100 free credits (one-time use)')
    
  } catch (error) {
    console.error('❌ Error generating codes:', error)
  } finally {
    await prisma.$disconnect()
  }
}

generateSpecialCodes()