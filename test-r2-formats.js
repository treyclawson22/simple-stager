const { S3Client, PutObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3')

// Test different R2 endpoint formats and credential combinations
const configs = [
  {
    name: "Current config with auto region",
    config: {
      region: 'auto',
      endpoint: 'https://f841420f888f3c8d80e42f02833e5828.r2.cloudflarestorage.com',
      credentials: {
        accessKeyId: 'AO5k2VnaMIEOY9-2Q9eZ45ZnJWLiYddsyXCuI1Gf',
        secretAccessKey: 'AO5k2VnaMIEOY9-2Q9eZ45ZnJWLiYddsyXCuI1Gf',
      },
    }
  },
  {
    name: "Standard S3 region format",
    config: {
      region: 'us-east-1',
      endpoint: 'https://f841420f888f3c8d80e42f02833e5828.r2.cloudflarestorage.com',
      credentials: {
        accessKeyId: 'AO5k2VnaMIEOY9-2Q9eZ45ZnJWLiYddsyXCuI1Gf',
        secretAccessKey: 'AO5k2VnaMIEOY9-2Q9eZ45ZnJWLiYddsyXCuI1Gf',
      },
    }
  },
  {
    name: "Truncated key format (first 32 chars)",
    config: {
      region: 'auto',
      endpoint: 'https://f841420f888f3c8d80e42f02833e5828.r2.cloudflarestorage.com',
      credentials: {
        accessKeyId: 'AO5k2VnaMIEOY9-2Q9eZ45ZnJWLiYddsyXCuI',
        secretAccessKey: 'AO5k2VnaMIEOY9-2Q9eZ45ZnJWLiYddsyXCuI',
      },
    }
  }
]

async function testR2Config(name, config) {
  console.log(`\n🔄 Testing: ${name}`)
  
  try {
    const client = new S3Client(config)
    
    // Test list objects (simpler than upload)
    const listCommand = new ListObjectsV2Command({
      Bucket: 'simple-stager-images',
      MaxKeys: 1
    })
    
    const result = await client.send(listCommand)
    console.log(`✅ SUCCESS: Listed ${result.Contents ? result.Contents.length : 0} objects`)
    
    return { success: true, config }
    
  } catch (error) {
    console.log(`❌ FAILED: ${error.message}`)
    return { success: false, error: error.message }
  }
}

async function findWorkingConfig() {
  console.log('🔄 Testing R2 configurations...\n')
  
  for (const { name, config } of configs) {
    const result = await testR2Config(name, config)
    if (result.success) {
      console.log(`\n🎉 WORKING CONFIGURATION FOUND: ${name}`)
      console.log('Config:', JSON.stringify(result.config, null, 2))
      return result.config
    }
  }
  
  console.log('\n❌ No working configuration found')
  return null
}

findWorkingConfig()