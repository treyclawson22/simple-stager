import fs from 'fs'
import path from 'path'
import { getR2Storage, isR2Configured } from './r2-storage'

export interface StorageResult {
  url: string
  key?: string
  isCloudStorage: boolean
}

/**
 * Generate file key with proper structure for cloud storage
 */
function generateFileKey(workflowId: string, filename: string, type: 'original' | 'staged' | 'thumbnail' = 'original'): string {
  const timestamp = Date.now()
  const cleanFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_')
  return `workflows/${workflowId}/${type}/${timestamp}_${cleanFilename}`
}

class FileStorage {
  /**
   * Upload a file using the configured storage method
   */
  async uploadFile(
    buffer: Buffer, 
    filename: string, 
    workflowId: string, 
    type: 'original' | 'staged' | 'thumbnail' = 'original'
  ): Promise<StorageResult> {
    
    if (isR2Configured()) {
      // Use R2 cloud storage
      return this.uploadToR2(buffer, filename, workflowId, type)
    } else {
      // Fallback to local storage
      return this.uploadToLocal(buffer, filename, workflowId, type)
    }
  }

  /**
   * Delete a file from storage
   */
  async deleteFile(url: string, key?: string): Promise<void> {
    if (key && isR2Configured()) {
      // Delete from R2
      const r2 = getR2Storage()
      await r2.deleteFile(key)
    } else {
      // Delete from local storage
      await this.deleteFromLocal(url)
    }
  }

  /**
   * Upload to R2 cloud storage
   */
  private async uploadToR2(
    buffer: Buffer, 
    filename: string, 
    workflowId: string, 
    type: 'original' | 'staged' | 'thumbnail'
  ): Promise<StorageResult> {
    try {
      const r2 = getR2Storage()
      const key = generateFileKey(workflowId, filename, type)
      const contentType = this.getContentType(filename)
      
      const url = await r2.uploadFile(key, buffer, contentType)
      
      console.log(`✅ R2 Upload Success: ${key} -> ${url}`)
      
      return {
        url,
        key,
        isCloudStorage: true
      }
    } catch (error) {
      console.error('R2 upload failed, falling back to local storage:', error)
      // Fallback to local storage on error
      return this.uploadToLocal(buffer, filename, workflowId, type)
    }
  }

  /**
   * Upload to local filesystem (fallback)
   */
  private async uploadToLocal(
    buffer: Buffer, 
    filename: string, 
    workflowId: string, 
    type: 'original' | 'staged' | 'thumbnail'
  ): Promise<StorageResult> {
    try {
      const uploadsDir = path.join(process.cwd(), 'apps', 'web', 'public', 'uploads', workflowId)
      await fs.promises.mkdir(uploadsDir, { recursive: true })

      const timestamp = Date.now()
      const cleanFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_')
      const localFilename = `${type}_${timestamp}_${cleanFilename}`
      const filePath = path.join(uploadsDir, localFilename)

      await fs.promises.writeFile(filePath, buffer)
      
      const url = `/uploads/${workflowId}/${localFilename}`
      
      console.log(`📁 Local Upload Success: ${url}`)
      
      return {
        url,
        isCloudStorage: false
      }
    } catch (error) {
      console.error('Local upload failed:', error)
      throw error
    }
  }

  /**
   * Delete from local filesystem
   */
  private async deleteFromLocal(url: string): Promise<void> {
    try {
      if (url.startsWith('/uploads/')) {
        const filePath = path.join(process.cwd(), 'apps', 'web', 'public', url)
        await fs.promises.unlink(filePath)
        console.log(`🗑️ Local Delete Success: ${url}`)
      }
    } catch (error) {
      console.error('Local delete failed:', error)
      // Don't throw - file might already be deleted
    }
  }

  /**
   * Get content type from filename
   */
  private getContentType(filename: string): string {
    const ext = path.extname(filename).toLowerCase()
    
    switch (ext) {
      case '.jpg':
      case '.jpeg':
        return 'image/jpeg'
      case '.png':
        return 'image/png'
      case '.gif':
        return 'image/gif'
      case '.webp':
        return 'image/webp'
      default:
        return 'application/octet-stream'
    }
  }

  /**
   * Check storage configuration
   */
  getStorageInfo(): { type: 'r2' | 'local'; configured: boolean } {
    if (isR2Configured()) {
      return { type: 'r2', configured: true }
    } else {
      return { type: 'local', configured: true }
    }
  }
}

// Export singleton instance
export const fileStorage = new FileStorage()