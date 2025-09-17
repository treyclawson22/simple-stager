'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function SignInPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'
  
  const [isLoading, setIsLoading] = useState(false)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
  })
  const [error, setError] = useState('')

  const handleOAuthSignIn = async (provider: 'google' | 'apple') => {
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

  const handleCredentialsAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    if (authMode === 'signup' && (!formData.name || formData.name.length < 2)) {
      setError('Name is required and must be at least 2 characters')
      setIsLoading(false)
      return
    }

    if (!formData.email || !formData.password) {
      setError('Email and password are required')
      setIsLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      setIsLoading(false)
      return
    }

    console.log('Starting sign-in with:', { 
      email: formData.email, 
      authMode, 
      isSignUp: authMode === 'signup' 
    })

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        name: formData.name,
        isSignUp: String(authMode === 'signup'),
        redirect: false,
      })

      console.log('Sign-in result:', result)

      if (result?.error) {
        console.error('Sign-in error:', result.error)
        if (result.error.includes('already exists')) {
          setError('An account with this email already exists. Try signing in instead.')
        } else {
          setError('Invalid email or password')
        }
      } else if (result?.ok) {
        console.log('Sign-in successful, redirecting to:', callbackUrl)
        // Redirect on successful authentication
        router.push(callbackUrl)
      }
    } catch (error) {
      console.error('Sign-in exception:', error)
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
            {authMode === 'signin' ? 'Sign in to your account' : 'Create your account'}
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

            <button
              onClick={() => handleOAuthSignIn('apple')}
              disabled={isLoading}
              className="w-full flex justify-center items-center px-4 py-3 border rounded-md shadow-sm text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2" style={{borderColor: '#464646', backgroundColor: '#464646'}} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#6E6E6E'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#464646'}
            >
              <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/>
              </svg>
              Continue with Apple
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
          <form onSubmit={handleCredentialsAuth} className="space-y-4">
            {authMode === 'signup' && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium" style={{color: '#464646'}}>
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required={authMode === 'signup'}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1"
                  style={{borderColor: '#E3F2FD', backgroundColor: '#FFFFFF', color: '#464646'}}
                  onFocus={(e) => {e.currentTarget.style.borderColor = '#089AB2'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(8, 154, 178, 0.2)'}}
                  onBlur={(e) => {e.currentTarget.style.borderColor = '#E3F2FD'; e.currentTarget.style.boxShadow = 'none'}}
                  placeholder="Enter your full name"
                />
              </div>
            )}

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
              {authMode === 'signup' && (
                <p className="mt-1 text-xs" style={{color: '#6E6E6E'}}>Must be at least 6 characters</p>
              )}
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
                  {authMode === 'signin' ? 'Signing in...' : 'Creating account...'}
                </div>
              ) : (
                authMode === 'signin' ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>

          {/* Toggle between sign in and sign up */}
          <div className="text-center">
            <button
              onClick={() => {
                setAuthMode(authMode === 'signin' ? 'signup' : 'signin')
                setError('')
                setFormData({ email: '', password: '', name: '' })
              }}
              className="text-sm"
              style={{color: '#089AB2'}}
              onMouseEnter={(e) => e.currentTarget.style.color = '#4DB6AC'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#089AB2'}
            >
              {authMode === 'signin' 
                ? "Don't have an account? Sign up" 
                : 'Already have an account? Sign in'
              }
            </button>
          </div>
        </div>

        {/* Test Link */}
        <div className="text-center pt-4 border-t" style={{borderColor: '#E3F2FD'}}>
          <Link href="/test" className="text-sm" style={{color: '#6E6E6E'}} onMouseEnter={(e) => e.currentTarget.style.color = '#464646'} onMouseLeave={(e) => e.currentTarget.style.color = '#6E6E6E'}>
            Try the staging tool without signing up →
          </Link>
        </div>
      </div>
    </div>
  )
}