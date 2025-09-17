export function generateReferralCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100)
}

export function getWorkflowGoalDisplay(goal: string): string {
  switch (goal) {
    case 'stage':
      return 'Stage (Add Furniture)'
    case 'declutter':
      return 'Declutter (Remove Clutter)'
    case 'improve':
      return 'Improve (Light Renovations)'
    default:
      return goal
  }
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}