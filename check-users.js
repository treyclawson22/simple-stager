const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function checkUsers() {
  console.log('=== Current Users ===')
  const users = await prisma.user.findMany({
    include: {
      password: true
    }
  })
  
  users.forEach(user => {
    console.log(`User: ${user.email}`)
    console.log(`  Name: ${user.name}`)
    console.log(`  Credits: ${user.credits}`)
    console.log(`  Auth Provider: ${user.authProvider}`)
    console.log(`  Has Password: ${user.password ? 'Yes' : 'No'}`)
    console.log('---')
  })

  console.log('\n=== Creating test credentials user ===')
  
  // Check if test@example.com exists
  const existingTest = await prisma.user.findUnique({
    where: { email: 'test@example.com' }
  })
  
  if (!existingTest) {
    console.log('Creating test@example.com user...')
    const hashedPassword = await bcrypt.hash('password123', 12)
    
    const testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
        authProvider: 'password',
        credits: 8,
        referralCode: 'TEST123',
      }
    })
    
    await prisma.password.create({
      data: {
        userId: testUser.id,
        hash: hashedPassword,
      }
    })
    
    console.log('✅ Created test@example.com with password123')
  } else {
    console.log('test@example.com already exists')
  }

  // Check if we need to add password to Trey's account
  const treyUser = await prisma.user.findUnique({
    where: { email: 'treyclawson@gmail.com' },
    include: { password: true }
  })
  
  if (treyUser && !treyUser.password) {
    console.log('Adding password credentials to Trey account...')
    const hashedPassword = await bcrypt.hash('password123', 12)
    
    await prisma.password.create({
      data: {
        userId: treyUser.id,
        hash: hashedPassword,
      }
    })
    
    console.log('✅ Added password to treyclawson@gmail.com (password123)')
  }
  
  await prisma.$disconnect()
}

checkUsers().catch(console.error)