# Railway Setup Guide

Since Docker isn't available locally, let's use Railway for the database services.

## Quick Railway Setup

### 1. Create Railway Database Services

Visit [Railway](https://railway.app) and create these services:

**PostgreSQL Database:**
```bash
# In Railway dashboard:
# 1. New Project
# 2. Add Service → Database → PostgreSQL
# 3. Copy the DATABASE_URL (starts with postgresql://)
```

**Redis Service:**
```bash
# In Railway dashboard:
# 1. Add Service → Database → Redis  
# 2. Copy the REDIS_URL (starts with redis://)
```

### 2. Update Your Environment Variables

Replace these in your `.env.local`:
```env
# Replace with your Railway URLs
DATABASE_URL="postgresql://postgres:****@****-railway.app:5432/railway"
REDIS_URL="redis://default:****@****-railway.app:6379"
```

### 3. Run Database Setup

After updating the URLs:
```bash
cd packages/database
npx prisma migrate dev --name init
npx prisma generate  
npm run db:seed
```

## Alternative: Local SQLite (for quick testing)

If you want to test immediately without Railway:

1. **Update database to SQLite:**
```env
DATABASE_URL="file:./dev.db"
```

2. **Update Prisma schema:**
```prisma
datasource db {
  provider = "sqlite"  // Change from "postgresql"
  url      = env("DATABASE_URL")
}
```

3. **Disable Redis features temporarily** (comment out queue imports)

Would you like to:
- **A) Set up Railway database services** (recommended)
- **B) Use local SQLite for quick testing**
- **C) I'll help set up alternative cloud database**

Let me know your preference!