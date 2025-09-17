import { getCurrentUser } from '@/lib/session'
import { AccountSettings } from '@/components/settings/account-settings'

export default async function SettingsPage() {
  const user = await getCurrentUser()

  // For testing without auth, create a mock user
  const mockUser = {
    id: 'test-user',
    firstName: 'Test',
    lastName: 'User',
    name: 'Test User',
    email: 'test@example.com',
    credits: 3,
    plan: null,
    referralCode: 'TEST123',
    referralDiscount: true,
    hasUsedReferralDiscount: false
  }

  const displayUser = user || mockUser

  // Transform user for AccountSettings component
  const settingsUser = {
    id: displayUser.id,
    firstName: (displayUser as any).firstName || displayUser.name?.split(' ')[0] || 'User',
    lastName: (displayUser as any).lastName || displayUser.name?.split(' ')[1] || '',
    name: displayUser.name || 'User',
    email: displayUser.email,
    credits: displayUser.credits
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage your account information and preferences.
        </p>
      </div>

      <AccountSettings user={settingsUser} />
    </div>
  )
}