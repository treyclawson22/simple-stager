'use client'

import { useState } from 'react'
import Image from 'next/image'

interface FallbackImageProps {
  src: string
  alt: string
  className?: string
  fallbackText?: string
  [key: string]: any
}

export function FallbackImage({ 
  src, 
  alt, 
  className = '', 
  fallbackText = 'Image not available',
  ...props 
}: FallbackImageProps) {
  const [imageError, setImageError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Temporarily bypass fallback to test persistent storage
  // if (imageError) {
  //   return (
  //     <div 
  //       className={`flex items-center justify-center bg-gray-100 border border-gray-200 rounded-lg ${className}`}
  //       style={{ minHeight: '200px' }}
  //     >
  //       <div className="text-center p-4">
  //         <div className="text-gray-400 mb-2">
  //           <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  //             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  //           </svg>
  //         </div>
  //         <p className="text-sm text-gray-500">{fallbackText}</p>
  //         <p className="text-xs text-gray-400 mt-1">Production images pending setup</p>
  //       </div>
  //     </div>
  //   )
  // }

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <div className="text-gray-400">
            <svg className="animate-spin h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={className}
        onError={() => {
          setImageError(true)
          setIsLoading(false)
        }}
        onLoad={() => setIsLoading(false)}
        {...props}
      />
    </div>
  )
}