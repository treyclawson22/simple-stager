const { PrismaClient } = require('@prisma/client');

async function getProductionUsers() {
  // Use production database URL
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: "postgresql://postgres:zQViwzixCJlzFQDxeIxWOmsWMpkCDYya@postgres.railway.internal:5432/railway"
      }
    }
  });

  try {
    console.log('🔍 Fetching production users...');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        credits: true,
        authProvider: true,
        referralCode: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            workflows: true,
            referrals: true,
            plans: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const totalUsers = users.length;
    const totalCredits = users.reduce((sum, user) => sum + user.credits, 0);
    const totalWorkflows = users.reduce((sum, user) => sum + user._count.workflows, 0);
    const totalPlans = users.reduce((sum, user) => sum + user._count.plans, 0);

    console.log('\n📊 PRODUCTION USER SUMMARY');
    console.log('=' .repeat(50));
    console.log(`Total Users: ${totalUsers}`);
    console.log(`Total Credits: ${totalCredits}`);
    console.log(`Total Workflows: ${totalWorkflows}`);
    console.log(`Total Active Plans: ${totalPlans}`);
    console.log('=' .repeat(50));

    if (users.length > 0) {
      console.log('\n👥 USER DETAILS:');
      console.log('-' .repeat(120));
      console.log('EMAIL'.padEnd(35) + 'NAME'.padEnd(25) + 'CREDITS'.padEnd(10) + 'WORKFLOWS'.padEnd(12) + 'PLANS'.padEnd(8) + 'AUTH'.padEnd(12) + 'CREATED');
      console.log('-' .repeat(120));
      
      users.forEach(user => {
        const email = (user.email || '').padEnd(35);
        const name = (user.name || '').padEnd(25);
        const credits = user.credits.toString().padEnd(10);
        const workflows = user._count.workflows.toString().padEnd(12);
        const plans = user._count.plans.toString().padEnd(8);
        const auth = (user.authProvider || '').padEnd(12);
        const created = user.createdAt.toISOString().split('T')[0];
        
        console.log(`${email}${name}${credits}${workflows}${plans}${auth}${created}`);
      });
    } else {
      console.log('\n❌ No users found in production database');
    }

  } catch (error) {
    console.error('❌ Error fetching users:', error.message);
    if (error.code === 'P1001') {
      console.log('💡 Database connection failed. This is likely due to Railway network restrictions.');
      console.log('💡 The production database is only accessible from within Railway\'s network.');
    }
  } finally {
    await prisma.$disconnect();
  }
}

getProductionUsers();