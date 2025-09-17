# SimpleStager - Real Estate Photo Enhancement SaaS

A Next.js application that uses AI to enhance real estate photos through staging, decluttering, and improvement workflows.

## Project Overview

SimpleStager is a real estate photo enhancement platform that allows users to:
- **Stage** empty rooms by adding furniture and decor
- **Declutter** messy spaces by removing personal items and clutter  
- **Improve** rooms with light renovations and updates

## Current Architecture

### AI Models
- **Claude Sonnet 4** (`claude-sonnet-4-20250514`) - Prompt generation
- **Gemini 2.5 Flash** (`gemini-2.5-flash-image-preview`) - Image generation

### Tech Stack
- **Next.js 15.5.3** with App Router and Turbopack
- **TypeScript**
- **Prisma ORM** with SQLite (local development)
- **Sharp** for image processing and watermarking
- **React Hook Form** for form handling
- **Tailwind CSS** for styling

### Key Features
- Test workflow at `/test` (bypasses authentication)
- Multi-step image upload and enhancement process
- Real-time prompt generation with Claude
- Image-to-image generation with Gemini
- Automatic watermarking with "SimpleStager" branding
- Architectural preservation (doesn't modify fixtures, columns, etc.)

## Environment Variables

Create `.env.local` with:
```bash
ANTHROPIC_API_KEY=sk-ant-api03-...
GEMINI_API_KEY=AIzaSyBQ3kb3EVcy0BrqxqDIbEEehNWa3sY4lk0
NEXTAUTH_URL=http://localhost:3000
DATABASE_URL="file:./dev.db"
```

## Development Setup

1. Install dependencies:
```bash
npm install
```

2. Run database migrations:
```bash
npx prisma migrate dev
```

3. Start development server:
```bash
npm run dev
```

4. Optional: Start Prisma Studio (port 5556):
```bash
npx --workspace=packages/database prisma studio --port 5556
```

## Testing

Access the test workflow at: `http://localhost:3000/test`

This bypasses authentication and creates a test user automatically.

## Project Structure

```
apps/web/src/
├── app/
│   ├── api/
│   │   └── test/workflows/          # Test API endpoints
│   └── test/                        # Test page (bypasses auth)
├── components/
│   └── test/                        # Test workflow components
├── lib/
│   ├── claude.ts                    # Claude API integration
│   ├── nano-banana.ts              # Gemini image generation
│   └── watermark.ts                # Image watermarking
└── ...
```

## Recent Updates

- Updated to Claude Sonnet 4 for better prompt generation
- Fixed watermarking coordinate issues (Sharp requires integers)
- Added architectural preservation instructions to staging prompts
- Added additional context field for user input
- Removed mock fallback system (real AI only)
- Enhanced error handling and API fallbacks

## API Endpoints

### Test Workflows (bypasses auth)
- `POST /api/test/workflows` - Create new workflow
- `POST /api/test/workflows/generate-prompt` - Generate AI prompt
- `POST /api/test/workflows/generate` - Generate enhanced image

## Current Status

✅ **Working Features:**
- Image upload and storage
- Claude Sonnet 4 prompt generation
- Gemini 2.5 Flash image generation
- Watermarking with proper coordinate handling
- Test workflow with full UI

⚠️ **Known Limitations:**
- SQLite database (local only)
- No authentication in production workflows
- Limited error handling for API quotas

## Deployment

The application is ready for deployment on Vercel with environment variables configured.

## Support

For issues or questions, refer to the CLAUDE.md file for detailed context and recent changes.