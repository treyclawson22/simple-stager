import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import AppleProvider from 'next-auth/providers/apple'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@simple-stager/database'
import { generateReferralCode } from '@simple-stager/shared'
import bcrypt from 'bcryptjs'

export const { handlers, auth, signIn, signOut } = NextAuth({
  // adapter: PrismaAdapter(prisma), // Remove adapter for credentials provider compatibility
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    AppleProvider({
      clientId: process.env.APPLE_ID!,
      clientSecret: process.env.APPLE_SECRET!,
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
        console.log('Credentials authorize called:', credentials)
        
        if (!credentials?.email || !credentials?.password) {
          console.log('Missing email or password')
          return null
        }

        const email = credentials.email as string
        const password = credentials.password as string
        const name = credentials.name as string
        const isSignUp = credentials.isSignUp === 'true'

        console.log('Auth attempt:', { email, isSignUp })

        try {
          if (isSignUp) {
            console.log('Sign up flow')
            // Sign up flow
            const existingUser = await prisma.user.findUnique({
              where: { email }
            })

            if (existingUser) {
              console.log('User already exists')
              throw new Error('User already exists with this email')
            }

            const hashedPassword = await bcrypt.hash(password, 12)
            const referralCode = generateReferralCode()

            console.log('Creating new user...')

            const user = await prisma.user.create({
              data: {
                email,
                name: name || null,
                authProvider: 'password',
                credits: 3,
                referralCode,
              }
            })

            console.log('User created:', user.id)

            // Store password hash
            await prisma.password.create({
              data: {
                userId: user.id,
                hash: hashedPassword,
              }
            })

            console.log('Password stored')

            // Add initial trial credits to ledger
            await prisma.creditLedger.create({
              data: {
                userId: user.id,
                delta: 3,
                reason: 'trial',
                meta: JSON.stringify({ message: 'Welcome! Free trial credits' }),
              },
            })

            console.log('Credits added, returning user')

            return {
              id: user.id,
              email: user.email,
              name: user.name,
            }
          } else {
            console.log('Sign in flow')
            // Sign in flow
            const user = await prisma.user.findUnique({
              where: { email }
            })

            if (!user) {
              console.log('User not found')
              return null
            }

            if (user.authProvider !== 'password') {
              console.log('User exists but not password auth')
              return null
            }

            // Get password hash
            const passwordRecord = await prisma.password.findUnique({
              where: { userId: user.id }
            })

            if (!passwordRecord) {
              console.log('No password record found')
              return null
            }

            const isValid = await bcrypt.compare(password, passwordRecord.hash)
            
            if (!isValid) {
              console.log('Invalid password')
              return null
            }

            console.log('Password valid, returning user')

            return {
              id: user.id,
              email: user.email,
              name: user.name,
            }
          }
        } catch (error) {
          console.error('Auth error:', error)
          throw error
        }
      }
    }),
  ],
  events: {
    createUser: async ({ user }) => {
      if (user.email && user.id && !user.id.startsWith('temp-')) {
        // Only for OAuth users (Google/Apple)
        const existingUser = await prisma.user.findUnique({
          where: { id: user.id }
        })

        if (!existingUser?.referralCode) {
          const authProvider = user.image ? 'google' : 'apple'
          
          await prisma.user.update({
            where: { id: user.id },
            data: {
              authProvider,
              credits: 3,
              referralCode: generateReferralCode(),
            },
          })
          
          // Add initial trial credits to ledger
          await prisma.creditLedger.create({
            data: {
              userId: user.id,
              delta: 3,
              reason: 'trial',
              meta: JSON.stringify({ message: 'Welcome! Free trial credits' }),
            },
          })
        }
      }
    },
  },
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signin',
  },
  callbacks: {
    redirect: async ({ url, baseUrl }) => {
      // Ensure all redirects go to localhost:3000
      if (url.startsWith('http://localhost:3001')) {
        return url.replace('http://localhost:3001', 'http://localhost:3000')
      }
      // If it's a relative URL, prepend baseUrl
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`
      }
      // If url is on the same origin, allow
      if (new URL(url).origin === baseUrl) {
        return url
      }
      // Default to baseUrl
      return baseUrl
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