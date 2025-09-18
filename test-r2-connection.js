const { S3Client, ListObjectsV2Command, PutObjectCommand } = require('@aws-sdk/client-s3')

// Test R2 connection with proper S3 credentials
const r2Client = new S3Client({
  region: 'auto',
  endpoint: 'https://f841420f888f3c8d80e42f02833e5828.r2.cloudflarestorage.com',
  credentials: {
    accessKeyId: 'fc1c4ef1bd0a1699d0968dd39fbda56b',
    secretAccessKey: '3c7fcbc2128310b4ecd023204c430baf96abf3e453ced4737976725a30720ee7',
  },
})

async function testR2Connection() {
  try {
    console.log('🔄 Testing R2 connection...')
    
    // Test 1: List bucket contents
    const listCommand = new ListObjectsV2Command({
      Bucket: 'simple-stager-images',
      MaxKeys: 5
    })
    
    const listResult = await r2Client.send(listCommand)
    console.log(`✅ Connection successful! Found ${listResult.Contents ? listResult.Contents.length : 0} objects in bucket`)
    
    if (listResult.Contents && listResult.Contents.length > 0) {
      console.log('📁 Existing objects:')
      listResult.Contents.forEach(obj => {
        console.log(`   - ${obj.Key} (${obj.Size} bytes)`)
      })
    }
    
    // Test 2: Upload a small test file
    console.log('\n🔄 Testing upload...')
    const testData = Buffer.from('Test upload from SimpleStager')
    const uploadCommand = new PutObjectCommand({
      Bucket: 'simple-stager-images',
      Key: 'test/connection-test.txt',
      Body: testData,
      ContentType: 'text/plain',
    })
    
    await r2Client.send(uploadCommand)
    const testUrl = 'https://f841420f888f3c8d80e42f02833e5828.r2.cloudflarestorage.com/simple-stager-images/test/connection-test.txt'
    console.log(`✅ Upload successful: ${testUrl}`)
    
    console.log('\n🎉 R2 is properly configured and ready for migration!')
    return true
    
  } catch (error) {
    console.error('❌ R2 connection failed:', error.message)
    return false
  }
}

testR2Connection()