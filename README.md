# SimpleStager

AI-powered real estate photo enhancement SaaS application that allows agents to transform room photos with three modes: Stage (add furniture), Declutter (remove clutter), or Improve (light renovations).

## Features

- 🏠 **Three Enhancement Modes**
  - **Stage**: Add furniture and decor to empty rooms
  - **Declutter**: Remove personal items and clutter
  - **Improve**: Light renovations like paint and lighting

- 🤖 **AI-Powered Processing**
  - ChatGPT for intelligent prompt generation
  - Nano Banana API for image generation
  - Professional-quality results in minutes

- 💳 **Credit-Based System**
  - 3 free trial credits for new users
  - Flexible subscription plans
  - Pay-per-download model

- 🔒 **Authentication & Security**
  - Google OAuth integration
  - Session management with NextAuth
  - Secure file uploads and processing

- 📱 **Modern Interface**
  - Responsive design with Tailwind CSS
  - Real-time progress updates
  - Intuitive workflow management

## Tech Stack

- **Frontend**: Next.js 14+ with App Router, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes
- **Database**: PostgreSQL with Prisma ORM
- **Queue**: BullMQ with Redis for image processing
- **Auth**: NextAuth.js with Google OAuth
- **APIs**: OpenAI API (ChatGPT), Nano Banana API
- **File Processing**: Sharp for image manipulation

## Project Structure

```
simple-stager/
├── apps/
│   └── web/                    # Next.js application
│       ├── src/
│       │   ├── app/
│       │   │   ├── (auth)/     # Authentication pages
│       │   │   ├── (dashboard)/ # Protected dashboard pages
│       │   │   ├── api/        # API routes
│       │   │   └── page.tsx    # Landing page
│       │   ├── components/     # React components
│       │   │   ├── upload/
│       │   │   ├── prompt-builder/
│       │   │   └── workflow/
│       │   └── lib/            # Utilities and configurations
├── packages/
│   ├── database/               # Prisma schema & client
│   ├── queue/                  # BullMQ setup
│   └── shared/                 # Shared types & utils
└── docker-compose.yml          # Local development services
```

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Redis instance
- OpenAI API key
- Nano Banana API key (for image generation)

### Installation

1. **Clone and install dependencies**:
   ```bash
   git clone <your-repo>
   cd simple-stager
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your actual API keys and database URLs in `.env.local`:
   ```env
   # Database
   DATABASE_URL="postgresql://postgres:password@localhost:5432/simplestager"
   REDIS_URL="redis://localhost:6379"

   # Authentication
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-nextauth-secret"
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"

   # APIs
   OPENAI_API_KEY="your-openai-api-key"
   NANO_BANANA_API_KEY="your-nano-banana-api-key"
   NANO_BANANA_API_URL="https://api.nanobanana.com"

   # File Storage
   UPLOAD_DIR="./uploads"
   PUBLIC_URL="http://localhost:3000"
   ```

3. **Start local services** (if using Docker):
   ```bash
   docker compose up -d
   ```

4. **Set up the database**:
   ```bash
   cd packages/database
   npx prisma migrate dev
   npx prisma generate
   npm run db:seed
   ```

5. **Start the development server**:
   ```bash
   npm run dev
   ```

6. **Start the image processing worker** (in a separate terminal):
   ```bash
   cd packages/queue
   node worker.js
   ```

The application will be available at [http://localhost:3000](http://localhost:3000).

## API Configuration

### Google OAuth Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Create OAuth 2.0 credentials
5. Add your domain to authorized origins
6. Add your callback URL: `http://localhost:3000/api/auth/callback/google`

### OpenAI API

1. Sign up at [OpenAI](https://openai.com/)
2. Navigate to API keys and create a new key
3. Add the key to your environment variables

### Nano Banana API

1. Sign up for Nano Banana API access
2. Get your API key and endpoint URL
3. Add to your environment variables

## Database Schema

The application uses the following key models:

- **User**: User accounts with credits and referral codes
- **Plan**: Subscription plans (Starter, Pro, Enterprise)
- **Workflow**: Photo enhancement workflows
- **Job**: Background image generation jobs
- **Result**: Generated images with watermarked previews
- **CreditLedger**: Credit transaction history

## Usage

1. **Sign up**: Create an account with Google OAuth
2. **Upload**: Upload a room photo and select enhancement goal
3. **Configure**: Answer questions about style and preferences
4. **Generate**: AI creates a custom prompt and generates the image
5. **Download**: Use credits to download high-resolution results

## Credit System

- New users get 3 free trial credits
- Each download costs 1 credit
- Subscription plans provide monthly credits:
  - Starter: 50 credits/month ($29)
  - Pro: 200 credits/month ($79)
  - Enterprise: 1000 credits/month ($199)

## Development

### Adding New Features

1. Database changes: Update `packages/database/schema.prisma`
2. API endpoints: Add to `apps/web/src/app/api/`
3. Components: Add to `apps/web/src/components/`
4. Types: Add to `packages/shared/types.ts`

### Running Tests

```bash
npm run test
```

### Building for Production

```bash
npm run build
```

### Database Operations

```bash
# Generate Prisma client
npm run db:generate

# Create migration
npm run db:migrate

# View database
npm run db:studio

# Seed database
npm run db:seed
```

## Deployment

The application is designed to be deployed on:

- **Frontend**: Vercel or Netlify
- **Database**: Railway, Supabase, or PlanetScale
- **Redis**: Upstash or Railway
- **File Storage**: AWS S3 or Cloudinary
- **Queue Workers**: Railway or Docker containers

### Environment Setup

Ensure all production environment variables are configured:

- Database URLs
- API keys
- Authentication secrets
- File storage configuration

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Support

For issues and questions:

- Create an issue in the GitHub repository
- Check the documentation
- Review the API endpoints

## License

[Add your chosen license]

---

Built with ❤️ using Next.js, Prisma, and OpenAI