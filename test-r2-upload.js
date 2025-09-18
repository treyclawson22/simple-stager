const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3')
const fs = require('fs')

// R2 Configuration
const r2Client = new S3Client({
  region: 'auto',
  endpoint: 'https://f841420f888f3c8d80e42f02833e5828.r2.cloudflarestorage.com',
  credentials: {
    accessKeyId: 'AO5k2VnaMIEOY9-2Q9eZ45ZnJWLiYddsyXCuI1Gf',
    secretAccessKey: 'AO5k2VnaMIEOY9-2Q9eZ45ZnJWLiYddsyXCuI1Gf',
  },
})

async function testR2Upload() {
  try {
    console.log('🔄 Testing R2 upload...')
    
    // Find first workflow with images
    const workflowDir = 'apps/web/public/uploads/cmfoafte800019suka0t21vuf'
    const files = fs.readdirSync(workflowDir)
    console.log(`📁 Found files: ${files.join(', ')}`)
    
    if (files.length > 0) {
      const testFile = files[0]
      const filePath = `${workflowDir}/${testFile}`
      console.log(`📤 Uploading test file: ${testFile}`)
      
      const buffer = fs.readFileSync(filePath)
      const command = new PutObjectCommand({
        Bucket: 'simple-stager-images',
        Key: `test/${testFile}`,
        Body: buffer,
        ContentType: 'image/jpeg',
      })

      await r2Client.send(command)
      const r2Url = `https://f841420f888f3c8d80e42f02833e5828.r2.cloudflarestorage.com/simple-stager-images/test/${testFile}`
      console.log(`✅ Upload successful: ${r2Url}`)
    }
    
  } catch (error) {
    console.error('❌ Upload failed:', error.message)
  }
}

testR2Upload()