import { TestPageClient } from '@/components/test/test-page-client'

// Test page that bypasses auth for development
export default function TestPage() {
  return <TestPageClient />
}