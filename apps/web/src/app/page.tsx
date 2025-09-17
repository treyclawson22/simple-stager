import Link from 'next/link'
import { ArrowRight, Sparkles, Upload, Wand2, Download } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Sparkles className="h-8 w-8 text-indigo-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">SimpleStager</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link
                href="/signin"
                className="text-gray-700 hover:text-gray-900 text-sm font-medium"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-indigo-50 to-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 mb-6">
              Transform Your Real Estate Photos with{' '}
              <span className="text-indigo-600">AI</span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Stage empty rooms, declutter spaces, and improve lighting instantly. 
              Professional-quality results in minutes, not hours.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="bg-indigo-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-indigo-700 flex items-center justify-center"
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              
              <Link
                href="#how-it-works"
                className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg text-lg font-medium hover:bg-gray-50"
              >
                See How It Works
              </Link>
            </div>
            
            <div className="mt-8 text-sm text-gray-500">
              ✨ 3 free credits • No credit card required • Professional results
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-xl text-gray-600">Three simple steps to transformed photos</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <Upload className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">1. Upload Photo</h3>
                <p className="text-gray-600">Upload your room photo and choose your enhancement goal</p>
              </div>
            </div>
            
            <div className="text-center">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <Wand2 className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">2. AI Magic</h3>
                <p className="text-gray-600">Our AI analyzes and transforms your space professionally</p>
              </div>
            </div>
            
            <div className="text-center">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <Download className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">3. Download</h3>
                <p className="text-gray-600">Get your professionally enhanced photo in minutes</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Three Enhancement Modes</h2>
            <p className="text-xl text-gray-600">Choose the perfect transformation for your needs</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">🛋️ Stage</h3>
              <p className="text-gray-600 mb-4">Add furniture and decor to empty rooms. Perfect for vacant properties.</p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Add appropriate furniture</li>
                <li>• Professional styling</li>
                <li>• Buyer-friendly aesthetics</li>
              </ul>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">🧹 Declutter</h3>
              <p className="text-gray-600 mb-4">Remove personal items and clutter for clean, neutral spaces.</p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Remove personal photos</li>
                <li>• Clean surfaces</li>
                <li>• Organize spaces</li>
              </ul>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">✨ Improve</h3>
              <p className="text-gray-600 mb-4">Light renovations like paint, lighting, and modern touches.</p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Fresh paint colors</li>
                <li>• Better lighting</li>
                <li>• Modern updates</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Simple Pricing</h2>
            <p className="text-xl text-gray-600">Pay only for what you use</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Starter</h3>
              <div className="text-3xl font-bold text-gray-900 mb-4">$29<span className="text-lg text-gray-600">/mo</span></div>
              <ul className="space-y-2 text-sm text-gray-600 mb-6">
                <li>✓ 50 credits per month</li>
                <li>✓ All enhancement modes</li>
                <li>✓ HD downloads</li>
                <li>✓ Email support</li>
              </ul>
              <Link href="/signup" className="w-full bg-gray-900 text-white py-2 px-4 rounded-md text-center font-medium hover:bg-gray-800 block">
                Get Started
              </Link>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border-2 border-indigo-500 p-6 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-indigo-500 text-white px-3 py-1 rounded-full text-xs font-medium">Most Popular</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Pro</h3>
              <div className="text-3xl font-bold text-gray-900 mb-4">$79<span className="text-lg text-gray-600">/mo</span></div>
              <ul className="space-y-2 text-sm text-gray-600 mb-6">
                <li>✓ 200 credits per month</li>
                <li>✓ All enhancement modes</li>
                <li>✓ HD downloads</li>
                <li>✓ Priority support</li>
                <li>✓ Cloud storage integration</li>
              </ul>
              <Link href="/signup" className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md text-center font-medium hover:bg-indigo-700 block">
                Get Started
              </Link>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Enterprise</h3>
              <div className="text-3xl font-bold text-gray-900 mb-4">$199<span className="text-lg text-gray-600">/mo</span></div>
              <ul className="space-y-2 text-sm text-gray-600 mb-6">
                <li>✓ 1000 credits per month</li>
                <li>✓ All enhancement modes</li>
                <li>✓ HD downloads</li>
                <li>✓ Phone support</li>
                <li>✓ Cloud storage integration</li>
                <li>✓ Team collaboration</li>
              </ul>
              <Link href="/signup" className="w-full bg-gray-900 text-white py-2 px-4 rounded-md text-center font-medium hover:bg-gray-800 block">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-indigo-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Transform Your Photos?</h2>
          <p className="text-xl text-indigo-100 mb-8">Start with 3 free credits today</p>
          <Link
            href="/signup"
            className="bg-white text-indigo-600 px-8 py-3 rounded-lg text-lg font-medium hover:bg-gray-50 inline-flex items-center"
          >
            Get Started Free
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Sparkles className="h-6 w-6 text-indigo-400" />
              <span className="ml-2 text-lg font-bold">SimpleStager</span>
            </div>
            <p className="text-gray-400">Transform your real estate photos with AI</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
