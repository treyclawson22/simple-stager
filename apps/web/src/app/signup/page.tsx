'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Link from 'next/link'

function SignupForm() {
  const searchParams = useSearchParams()
  const [referralCode, setReferralCode] = useState('')
  const [isValidReferral, setIsValidReferral] = useState(false)
  const [isCheckingReferral, setIsCheckingReferral] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  })

  // Auto-fill referral code from URL parameter
  useEffect(() => {
    const refCode = searchParams.get('ref')
    if (refCode) {
      setReferralCode(refCode.toUpperCase())
      validateReferralCode(refCode.toUpperCase())
    }
  }, [searchParams])

  const validateReferralCode = async (code: string) => {
    if (!code.trim()) {
      setIsValidReferral(false)
      return
    }
    
    setIsCheckingReferral(true)
    
    try {
      // TODO: Implement actual API call to validate referral code
      console.log(`Validating referral code: ${code}`)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Mock validation - any code 3+ characters is valid (except self-referral)
      const isValid = code.length >= 3
      setIsValidReferral(isValid)
    } catch (error) {
      setIsValidReferral(false)
      console.error('Error validating referral code:', error)
    } finally {
      setIsCheckingReferral(false)
    }
  }

  const handleReferralCodeChange = (code: string) => {
    const upperCode = code.toUpperCase()
    setReferralCode(upperCode)
    
    if (upperCode.trim()) {
      validateReferralCode(upperCode)
    } else {
      setIsValidReferral(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleOAuthSignUp = async (provider: 'google') => {
    setIsLoading(true)
    
    try {
      await signIn(provider, { 
        callbackUrl: '/dashboard',
        redirect: true 
      })
    } catch (error) {
      console.error('OAuth signup failed:', error)
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    // Basic validation
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match')
      setIsLoading(false)
      return
    }
    
    if (formData.password.length < 6) {
      alert('Password must be at least 6 characters')
      setIsLoading(false)
      return
    }
    
    try {
      // Create account directly via API instead of using NextAuth signIn
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: `${formData.firstName} ${formData.lastName}`.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Signup failed')
      }

      // Now sign in the user after successful account creation
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        isSignUp: 'false', // Now signing in, not signing up
        redirect: false,
      })

      if (result?.error) {
        alert('Account created but sign-in failed: ' + result.error)
      } else if (result?.ok) {
        // Redirect to dashboard on successful sign-in
        window.location.href = '/dashboard'
      }
    } catch (error) {
      console.error('Signup error:', error)
      alert('Signup failed: ' + (error as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <img src="/logo.png" alt="SimpleStager" className="mx-auto h-21 w-auto" />
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Or{' '}
            <Link href="/login" className="font-medium text-teal-600 hover:text-teal-500">
              sign in to your existing account
            </Link>
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* OAuth Providers */}
          {true && (
            <>
              <div className="space-y-3 mb-6">
                <button
                  onClick={() => handleOAuthSignUp('google')}
                  disabled={isLoading}
                  className="w-full flex justify-center items-center px-4 py-3 border rounded-md shadow-sm text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 hover:bg-gray-50"
                  style={{borderColor: '#E3F2FD', backgroundColor: '#FFFFFF', color: '#464646'}}
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
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">or</span>
                </div>
              </div>
            </>
          )}

          {/* Referral Code Section */}
          {referralCode && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-3 mb-3">
                <div className="text-blue-600">🎁</div>
                <div>
                  <h4 className="text-sm font-medium text-blue-900">You're invited!</h4>
                  <p className="text-xs text-blue-700">Get 25% off your first month subscription</p>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Referral code"
                  value={referralCode}
                  onChange={(e) => handleReferralCodeChange(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {isCheckingReferral ? (
                  <div className="flex items-center text-gray-500">
                    <span className="text-sm">Checking...</span>
                  </div>
                ) : isValidReferral ? (
                  <div className="flex items-center text-green-600">
                    <span className="text-sm">✓ Valid</span>
                  </div>
                ) : referralCode ? (
                  <div className="flex items-center text-red-600">
                    <span className="text-sm">✗ Invalid</span>
                  </div>
                ) : null}
              </div>
              
              {isValidReferral && (
                <p className="text-xs text-green-600 mt-2 font-medium">
                  🎉 You'll get 25% off your first subscription!
                </p>
              )}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                  First name
                </label>
                <div className="mt-1">
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                  Last name
                </label>
                <div className="mt-1">
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm password
              </label>
              <div className="mt-1">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
            </div>

            {/* Manual Referral Code Input (if not from link) */}
            {!searchParams.get('ref') && (
              <div>
                <label htmlFor="manualReferralCode" className="block text-sm font-medium text-gray-700">
                  Referral code (optional)
                </label>
                <div className="mt-1">
                  <div className="flex space-x-2">
                    <input
                      id="manualReferralCode"
                      name="manualReferralCode"
                      type="text"
                      placeholder="Enter referral code"
                      value={referralCode}
                      onChange={(e) => handleReferralCodeChange(e.target.value)}
                      className="flex-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                    />
                    {isCheckingReferral ? (
                      <div className="flex items-center text-gray-500">
                        <span className="text-sm">...</span>
                      </div>
                    ) : isValidReferral ? (
                      <div className="flex items-center text-green-600">
                        <span className="text-sm">✓</span>
                      </div>
                    ) : referralCode ? (
                      <div className="flex items-center text-red-600">
                        <span className="text-sm">✗</span>
                      </div>
                    ) : null}
                  </div>
                  {isValidReferral && (
                    <p className="text-xs text-green-600 mt-1">
                      You'll get 25% off your first subscription!
                    </p>
                  )}
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#089AB2' }}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating account...
                  </div>
                ) : (
                  <>
                    Create account
                    {isValidReferral && ' (with 25% discount!)'}
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="text-center">
              <p className="text-xs text-gray-500">
                By signing up, you agree to our{' '}
                <Link href="/terms" className="text-teal-600 hover:text-teal-500">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-teal-600 hover:text-teal-500">
                  Privacy Policy
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignupForm />
    </Suspense>
  )
}