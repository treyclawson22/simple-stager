'use client'

import { useState, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function SignInForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'
  
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [error, setError] = useState('')

  const handleOAuthSignIn = async (provider: 'google') => {
    setIsLoading(true)
    setError('')
    
    try {
      await signIn(provider, { 
        callbackUrl,
        redirect: true 
      })
    } catch (error) {
      setError('Authentication failed. Please try again.')
      setIsLoading(false)
    }
  }

  const handleCredentialsSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    if (!formData.email || !formData.password) {
      setError('Email and password are required')
      setIsLoading(false)
      return
    }

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        isSignUp: 'false',
        redirect: false,
      })

      if (result?.error) {
        setError('Invalid email or password')
      } else if (result?.ok) {
        router.push(callbackUrl)
      }
    } catch (error) {
      setError('Authentication failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8" style={{backgroundColor: '#F9FAFB'}}>
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto flex items-center justify-center">
            <img src="/logo.png" alt="SimpleStager" className="h-28 w-auto" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold" style={{color: '#464646'}}>
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm" style={{color: '#6E6E6E'}}>
            Transform your real estate photos with AI
          </p>
        </div>

        <div className="space-y-6">
          {/* OAuth Providers */}
          <div className="space-y-3">
            <button
              onClick={() => handleOAuthSignIn('google')}
              disabled={isLoading}
              className="w-full flex justify-center items-center px-4 py-3 border rounded-md shadow-sm text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2" style={{borderColor: '#E3F2FD', backgroundColor: '#FFFFFF', color: '#464646'}} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#E3F2FD'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFFFFF'}
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" style={{borderColor: '#E3F2FD'}} />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2" style={{backgroundColor: '#F9FAFB', color: '#6E6E6E'}}>or</span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleCredentialsSignIn} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium" style={{color: '#464646'}}>
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1"
                style={{borderColor: '#E3F2FD', backgroundColor: '#FFFFFF', color: '#464646'}}
                onFocus={(e) => {e.currentTarget.style.borderColor = '#089AB2'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(8, 154, 178, 0.2)'}}
                onBlur={(e) => {e.currentTarget.style.borderColor = '#E3F2FD'; e.currentTarget.style.boxShadow = 'none'}}
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium" style={{color: '#464646'}}>
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1"
                style={{borderColor: '#E3F2FD', backgroundColor: '#FFFFFF', color: '#464646'}}
                onFocus={(e) => {e.currentTarget.style.borderColor = '#089AB2'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(8, 154, 178, 0.2)'}}
                onBlur={(e) => {e.currentTarget.style.borderColor = '#E3F2FD'; e.currentTarget.style.boxShadow = 'none'}}
                placeholder="Enter your password"
              />
            </div>

            {error && (
              <div className="rounded-md p-4" style={{backgroundColor: '#FFE8E8'}}>
                <div className="text-sm" style={{color: '#C53030'}}>{error}</div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2"
              style={{backgroundColor: '#089AB2'}}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4DB6AC'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#089AB2'}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Signing in...
                </div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Sign Up Link */}
          <div className="text-center">
            <Link
              href="/signup"
              className="text-sm"
              style={{color: '#089AB2'}}
              onMouseEnter={(e) => e.currentTarget.style.color = '#4DB6AC'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#089AB2'}
            >
              Don't have an account? Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignInForm />
    </Suspense>
  )
}