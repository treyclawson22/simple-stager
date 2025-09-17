'use client'

interface ReferralBannerProps {
  referralCode: string
}

export function ReferralBanner({ referralCode }: ReferralBannerProps) {
  const handleCopyReferralLink = () => {
    const referralLink = `${window.location.origin}/signup?ref=${referralCode}`
    navigator.clipboard.writeText(referralLink)
    alert('Referral link copied to clipboard!')
  }

  return (
    <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
      <div className="flex items-start space-x-3">
        <div className="text-2xl">🎁</div>
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-1">Referral Program</h3>
          <p className="text-xs text-gray-600 mb-2">
            Invite friends and both of you benefit! You earn a <span className="font-semibold text-green-600">$10 Amazon Gift Card</span> when they subscribe or purchase credits, and they get <span className="font-semibold text-blue-600">25% off their first month</span> when they use your referral code.
          </p>
          <button 
            onClick={handleCopyReferralLink}
            className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
          >
            Share Your Code: {referralCode}
          </button>
        </div>
      </div>
    </div>
  )
}