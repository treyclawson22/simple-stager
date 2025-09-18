import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@simple-stager/database'
import { generateReferralCode } from '@simple-stager/shared'
import { withDatabaseRetry } from '@/lib/db-retry'
import bcrypt from 'bcryptjs'

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Note: PrismaAdapter commented out for CredentialsProvider compatibility
  // adapter: PrismaAdapter(prisma),
  trustHost: true, // Trust the host in production (required for Railway deployment)
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        name: { label: 'Name', type: 'text' },
        isSignUp: { type: 'hidden' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const email = credentials.email as string
        const password = credentials.password as string
        const name = credentials.name as string
        const isSignUp = credentials.isSignUp === 'true'

        try {
          if (isSignUp) {
            // Sign up flow - handled by separate API now
            return null
          }

          // Sign in flow with database retry logic
          return await withDatabaseRetry(async () => {
            const user = await prisma.user.findUnique({
              where: { email }
            })

            if (!user) {
              return null
            }

            if (user.authProvider !== 'password') {
              return null
            }

            // Get password hash
            const passwordRecord = await prisma.password.findUnique({
              where: { userId: user.id }
            })

            if (!passwordRecord) {
              return null
            }

            const isValid = await bcrypt.compare(password, passwordRecord.hash)
            
            if (!isValid) {
              return null
            }

            return {
              id: user.id,
              email: user.email,
              name: user.name,
            }
          }, { maxRetries: 5, delay: 2000, wakeUpDatabase: true })
        } catch (error) {
          console.error('Auth error:', error)
          throw error
        }
      }
    }),
  ],
  pages: {
    signIn: '/',
    signOut: '/',
  },
  callbacks: {
    redirect: async ({ url, baseUrl }) => {
      console.log('Auth redirect:', { url, baseUrl })
      
      // Handle localhost development redirects (keep on same port)
      if (url.startsWith('http://localhost:3000')) {
        return url.replace('http://localhost:3000', 'http://localhost:3001')
      }
      
      // For production, keep the same origin - no cross-domain redirects
      // This prevents redirect loops between Railway and app.simplestager.com
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`
      }
      
      // If url is on the same origin, allow
      if (new URL(url).origin === baseUrl) {
        return url
      }
      
      // For any external redirects, stay on the current domain
      return baseUrl
    },
    signIn: async ({ user, account }) => {
      if (account?.provider === 'google' && user.email) {
        try {
          // Wrap Google OAuth database operations in retry logic
          await withDatabaseRetry(async () => {
            // Check if user already exists
            const existingUser = await prisma.user.findUnique({
              where: { email: user.email! }
            })

            if (!existingUser) {
              // Create new user for Google OAuth
              const newUser = await prisma.user.create({
                data: {
                  email: user.email!,
                  name: user.name || null,
                  authProvider: 'google',
                  credits: 3,
                  referralCode: generateReferralCode(),
                }
              })

              // Add initial trial credits to ledger
              await prisma.creditLedger.create({
                data: {
                  userId: newUser.id,
                  delta: 3,
                  reason: 'trial',
                  meta: JSON.stringify({ message: 'Welcome! Free trial credits' }),
                },
              })

              // Set the user ID for the session
              user.id = newUser.id
            } else {
              // Use existing user ID
              user.id = existingUser.id
            }
          }, { maxRetries: 5, delay: 2000, wakeUpDatabase: true })
        } catch (error) {
          console.error('Error creating/finding user:', error)
          return false
        }
      }
      return true
    },
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id
      }
      return token
    },
    session: async ({ session, token }) => {
      if (token?.id) {
        (session.user as any).id = token.id
      }
      return session
    },
  },
  session: {
    strategy: 'jwt',
  },
})