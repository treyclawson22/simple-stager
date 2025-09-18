import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

class R2Storage {
  private client: S3Client
  private bucketName: string

  constructor() {
    // R2 is S3-compatible, so we use the AWS SDK
    this.client = new S3Client({
      region: 'auto', // R2 uses 'auto' region
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    })
    this.bucketName = process.env.R2_BUCKET_NAME!
  }

  /**
   * Upload a file to R2
   */
  async uploadFile(key: string, buffer: Buffer, contentType: string): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        // R2 doesn't support ACLs like S3, public access is set at bucket level
      })

      await this.client.send(command)

      // Return the public URL
      return this.getPublicUrl(key)
    } catch (error) {
      console.error('R2 upload error:', error)
      throw new Error(`Failed to upload file to R2: ${error}`)
    }
  }

  /**
   * Delete a file from R2
   */
  async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      })

      await this.client.send(command)
    } catch (error) {
      console.error('R2 delete error:', error)
      throw new Error(`Failed to delete file from R2: ${error}`)
    }
  }

  /**
   * Check if a file exists in R2
   */
  async fileExists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      })

      await this.client.send(command)
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * Get public URL for a file
   */
  getPublicUrl(key: string): string {
    // R2 public URL format - using public domain
    return `https://pub-71859b8870504fed8f18385e91b192d3.r2.dev/${key}`
  }

  /**
   * Generate presigned URL for secure uploads (optional)
   */
  async getPresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      })

      return await getSignedUrl(this.client, command, { expiresIn })
    } catch (error) {
      console.error('R2 presigned URL error:', error)
      throw new Error(`Failed to generate presigned URL: ${error}`)
    }
  }

  /**
   * Generate file key with proper structure
   */
  static generateFileKey(workflowId: string, filename: string, type: 'original' | 'staged' | 'thumbnail' = 'original'): string {
    const timestamp = Date.now()
    const cleanFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_')
    return `workflows/${workflowId}/${type}/${timestamp}_${cleanFilename}`
  }
}

// Singleton instance
let r2Storage: R2Storage | null = null

export function getR2Storage(): R2Storage {
  if (!r2Storage) {
    // Check if all required environment variables are present
    const requiredVars = ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET_NAME']
    const missingVars = requiredVars.filter(varName => !process.env[varName])
    
    if (missingVars.length > 0) {
      throw new Error(`Missing R2 environment variables: ${missingVars.join(', ')}`)
    }

    r2Storage = new R2Storage()
  }
  return r2Storage
}

// Helper function to check if R2 is configured
export function isR2Configured(): boolean {
  const requiredVars = ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET_NAME']
  return requiredVars.every(varName => process.env[varName])
}