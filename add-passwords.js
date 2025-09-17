const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function addPasswords() {
  console.log('=== Adding passwords to existing users ===')
  
  // Users to add passwords for
  const userPasswords = [
    { email: 'test@example.com', password: 'password123' },
    { email: 'treyclawson@icloud.com', password: 'password123' },
    { email: 'newuser@example.com', password: 'password123' }
  ]
  
  for (const userConfig of userPasswords) {
    console.log(`Processing ${userConfig.email}...`)
    
    const user = await prisma.user.findUnique({
      where: { email: userConfig.email },
      include: { password: true }
    })
    
    if (!user) {
      console.log(`❌ User ${userConfig.email} not found`)
      continue
    }
    
    if (user.password) {
      console.log(`✅ User ${userConfig.email} already has password`)
      continue
    }
    
    // Add password
    const hashedPassword = await bcrypt.hash(userConfig.password, 12)
    
    await prisma.userPassword.create({
      data: {
        userId: user.id,
        passwordHash: hashedPassword,
      }
    })
    
    console.log(`✅ Added password to ${userConfig.email}`)
  }
  
  console.log('\n=== Verification ===')
  const users = await prisma.user.findMany({
    include: { password: true }
  })
  
  users.forEach(user => {
    console.log(`${user.email}: Credits=${user.credits}, HasPassword=${user.password ? 'Yes' : 'No'}`)
  })
  
  await prisma.$disconnect()
}

addPasswords().catch(console.error)