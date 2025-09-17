import prisma from './client'

async function main() {
  // Create default plans
  await prisma.plan.upsert({
    where: { id: 'starter' },
    update: {},
    create: {
      id: 'starter',
      name: 'Starter Plan',
      priceCents: 2900, // $29/month
      credits: 50,
      interval: 'monthly',
    },
  })

  await prisma.plan.upsert({
    where: { id: 'pro' },
    update: {},
    create: {
      id: 'pro',
      name: 'Pro Plan',
      priceCents: 7900, // $79/month
      credits: 200,
      interval: 'monthly',
    },
  })

  await prisma.plan.upsert({
    where: { id: 'enterprise' },
    update: {},
    create: {
      id: 'enterprise',
      name: 'Enterprise Plan',
      priceCents: 19900, // $199/month
      credits: 1000,
      interval: 'monthly',
    },
  })

  console.log('✅ Database seeded successfully')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })