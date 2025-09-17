'use client'

interface ReferralProgramProps {
  referralCode: string
  referrals: any[]
}

export function ReferralProgram({ referralCode, referrals }: ReferralProgramProps) {
  const handleCopyReferralLink = () => {
    const referralLink = `${window.location.origin}/signup?ref=${referralCode}`
    navigator.clipboard.writeText(referralLink)
    alert('Referral link copied to clipboard!')
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-xl font-semibold mb-4" style={{ color: '#464646' }}>Referral Program</h3>
      <div className="text-center bg-gray-50 p-4 rounded-lg">
        <div className="text-xs text-gray-600 mb-2">Your referral code</div>
        <div className="font-mono text-sm bg-white p-2 rounded mb-3 border">
          {referralCode}
        </div>
        
        <div className="text-xs text-gray-600 mb-3">
          <div className="mb-2">Share with friends and earn rewards:</div>
          <div className="text-green-600 font-medium mb-1">🎁 $10 Amazon Gift Card when they subscribe or buy credits</div>
          <div className="text-blue-600 font-medium">💰 They get 25% off their first month</div>
        </div>
        
        <button 
          onClick={handleCopyReferralLink}
          className="w-full bg-green-600 text-white px-3 py-2 rounded text-xs font-medium hover:bg-green-700"
        >
          Copy Referral Link
        </button>
        
        {referrals && referrals.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="text-xs text-gray-600">
              Successful referrals: <span className="font-medium">{referrals.length}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}