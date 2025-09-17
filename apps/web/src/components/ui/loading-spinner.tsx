'use client'

import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8', 
    lg: 'w-12 h-12'
  }

  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div className={cn(
        'animate-spin rounded-full border-2 border-gray-300 border-t-indigo-600',
        sizeClasses[size]
      )}>
      </div>
    </div>
  )
}

export function LoadingSpinnerWithText({ 
  text = "Processing...",
  size = 'md',
  className 
}: LoadingSpinnerProps & { text?: string }) {
  return (
    <div className={cn('flex flex-col items-center justify-center space-y-4', className)}>
      <LoadingSpinner size={size} />
      <p className="text-gray-600 text-sm font-medium">{text}</p>
    </div>
  )
}