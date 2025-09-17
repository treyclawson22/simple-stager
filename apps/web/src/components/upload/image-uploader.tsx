'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, AlertCircle } from 'lucide-react'
import { WorkflowGoal } from '@simple-stager/shared'

interface ImageUploaderProps {
  goal: WorkflowGoal
  onSuccess: (workflowId: string) => void
}

export function ImageUploader({ goal, onSuccess }: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [preview, setPreview] = useState<string>('')
  const [error, setError] = useState<string>('')

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    setIsUploading(true)
    setError('')

    try {
      // Create preview
      const previewUrl = URL.createObjectURL(file)
      setPreview(previewUrl)

      // Upload file
      const formData = new FormData()
      formData.append('file', file)
      formData.append('goal', goal)

      const response = await fetch('/api/workflows', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const { workflowId } = await response.json()
      onSuccess(workflowId)
      
    } catch (err) {
      setError('Failed to upload image. Please try again.')
      setPreview('')
    } finally {
      setIsUploading(false)
    }
  }, [goal, onSuccess])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  })

  const clearPreview = () => {
    setPreview('')
    setError('')
  }

  if (preview) {
    return (
      <div className="space-y-4">
        <div className="relative">
          <img
            src={preview}
            alt="Upload preview"
            className="w-full h-64 object-cover rounded-lg"
          />
          <button
            onClick={clearPreview}
            className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-md hover:bg-gray-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        
        {isUploading && (
          <div className="text-center">
            <div className="inline-flex items-center text-sm text-gray-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600 mr-2"></div>
              Creating workflow...
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-indigo-500 bg-indigo-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input {...getInputProps()} />
        
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        
        <div className="mt-4">
          <p className="text-sm font-medium text-gray-900">
            {isDragActive ? 'Drop your image here' : 'Upload a room photo'}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Drag and drop or click to browse
          </p>
          <p className="text-xs text-gray-500 mt-2">
            JPG, PNG, WebP up to 10MB
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center p-3 text-sm text-red-700 bg-red-50 rounded-md">
          <AlertCircle className="h-4 w-4 mr-2" />
          {error}
        </div>
      )}
      
      <div className="text-sm text-gray-600">
        <p className="font-medium mb-2">Tips for best results:</p>
        <ul className="space-y-1 text-xs">
          <li>• Use high-resolution photos (at least 1024x1024)</li>
          <li>• Ensure good lighting and clear room details</li>
          <li>• Include the full room view when possible</li>
          <li>• Avoid heavily filtered or edited images</li>
        </ul>
      </div>
    </div>
  )
}