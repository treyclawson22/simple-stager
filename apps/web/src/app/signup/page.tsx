'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function SignupForm() {
  const searchParams = useSearchParams()
  const [referralCode, setReferralCode] = useState('')
  const [isValidReferral, setIsValidReferral] = useState(false)
  const [isCheckingReferral, setIsCheckingReferral] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // TODO: Implement actual signup logic
    console.log('Signup data:', {
      ...formData,
      referralCode: isValidReferral ? referralCode : null,
      referralDiscount: isValidReferral,
      hasUsedReferralDiscount: false
    })
    
    alert('Signup would be processed here! (This is a demo)')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <img src="/logo.png" alt="SimpleStager" className="mx-auto h-12 w-auto" />
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
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full name
              </label>
              <div className="mt-1">
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                />
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
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                style={{ backgroundColor: '#089AB2' }}
              >
                Create account
                {isValidReferral && ' (with 25% discount!)'}
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