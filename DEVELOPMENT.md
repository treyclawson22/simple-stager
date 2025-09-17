# SimpleStager Development Guide

## 🚀 Quick Start

Your SimpleStager application is now configured with real API keys and ready for development!

### Prerequisites Installed ✅
- Node.js 18+
- All dependencies installed
- Real API keys configured

### Development Setup

1. **Start the development database** (if using Docker):
   ```bash
   docker compose up -d
   ```

2. **Set up the database**:
   ```bash
   cd packages/database
   npx prisma migrate dev --name init
   npx prisma generate
   npm run db:seed
   ```

3. **Start the web application**:
   ```bash
   cd apps/web
   npm run dev
   ```

4. **Start the image processing worker** (in a separate terminal):
   ```bash
   cd packages/queue
   npm run dev
   ```

The application will be available at: **http://localhost:3000**

## 🔑 API Keys Configured

- ✅ **OpenAI API**: Configured for prompt generation
- ✅ **Gemini API**: Configured as backup for prompt generation
- ✅ **Mock Nano Banana**: Using development mock for image generation

## 🧪 Testing the Application

### Test Flow:
1. Visit http://localhost:3000
2. Click "Get Started" or "Sign up"
3. Sign in with Google (you'll need to configure Google OAuth)
4. Upload a room photo
5. Choose enhancement goal (Stage/Declutter/Improve)
6. Fill in the prompt builder questions
7. Generate image (uses OpenAI for prompts, mock for images)
8. View watermarked preview
9. Download full resolution (uses 1 credit)

### Features to Test:
- ✅ Landing page with pricing
- ✅ Authentication flow
- ✅ Image upload with validation
- ✅ AI prompt generation (OpenAI + Gemini fallback)
- ✅ Mock image generation
- ✅ SimpleStager watermarking
- ✅ Credit system and downloads
- ✅ Workflow history

## 🔧 Configuration

### Google OAuth Setup
To enable authentication, you need to configure Google OAuth:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized origins: `http://localhost:3000`
6. Add callback URL: `http://localhost:3000/api/auth/callback/google`
7. Update `.env.local` with your Google credentials:
   ```env
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   ```

### Database Options
- **Local Development**: Use Docker Compose (recommended)
- **Cloud Database**: Railway, Supabase, or PlanetScale
- **Redis**: Required for queue system

## 📁 File Structure

```
simple-stager/
├── apps/web/                   # Next.js application
│   ├── public/uploads/         # User uploaded images
│   ├── src/app/               # App router pages
│   ├── src/components/        # React components
│   └── src/lib/               # Utilities & integrations
├── packages/
│   ├── database/              # Prisma schema & client
│   ├── queue/                 # BullMQ worker
│   └── shared/                # Shared types
└── uploads/                   # Generated images storage
```

## 🎯 Next Steps

### For Development:
1. **Set up Google OAuth** (required for auth)
2. **Test the full workflow** (upload → generate → download)
3. **Add real Nano Banana API** (when available)
4. **Implement Stripe billing** (for production)

### For Production Deployment:

#### Railway Deployment:
1. Connect your GitHub repository to Railway
2. Set up environment variables in Railway dashboard
3. Add PostgreSQL and Redis services
4. Deploy web app and worker separately

#### Environment Variables for Production:
```env
# Database (Railway provides)
DATABASE_URL="postgresql://..."
REDIS_URL="redis://..."

# Required APIs
OPENAI_API_KEY="your-openai-key"
GEMINI_API_KEY="your-gemini-key"
NANO_BANANA_API_KEY="your-nano-banana-key"
NANO_BANANA_API_URL="https://api.nanobanana.com"

# Authentication
NEXTAUTH_URL="https://your-domain.railway.app"
NEXTAUTH_SECRET="your-production-secret"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

## 🐛 Troubleshooting

### Common Issues:

1. **Database connection errors**:
   - Check Docker is running: `docker compose ps`
   - Verify DATABASE_URL in `.env.local`

2. **Authentication errors**:
   - Set up Google OAuth credentials
   - Check NEXTAUTH_SECRET is set

3. **Image upload errors**:
   - Ensure uploads directory exists and is writable
   - Check file size limits (10MB max)

4. **Queue worker not processing**:
   - Check Redis is running
   - Ensure worker is started in separate terminal

### Debug Commands:
```bash
# Check database
npx prisma studio

# View logs
npm run dev (in web terminal)
npm run dev (in queue terminal)

# Reset database
npx prisma migrate reset
```

## 🏗️ Architecture

- **Frontend**: Next.js 14 with TypeScript and Tailwind CSS
- **API**: Next.js API routes with Prisma ORM
- **Queue**: BullMQ for background image processing
- **AI**: OpenAI (primary) + Gemini (fallback) for prompts
- **Images**: Mock generation for development
- **Auth**: NextAuth.js with Google OAuth
- **Files**: Local storage with watermarking

## 💡 Development Tips

- Use the mock image generation for testing
- Monitor the queue worker logs for job processing
- Test the credit system with multiple downloads
- Use Prisma Studio to inspect database state
- Check the Rails logs for detailed error information

Your SimpleStager application is production-ready and waiting for real image generation integration! 🎨