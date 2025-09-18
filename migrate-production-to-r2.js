const { PrismaClient } = require('@prisma/client')
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3')
const fs = require('fs')
const path = require('path')

// Use Railway production database
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:zQViwzixCJlzFQDxeIxWOmsWMpkCDYya@crossover.proxy.rlwy.net:28966/railway"
    }
  }
})

// R2 Configuration
const r2Client = new S3Client({
  region: 'auto',
  endpoint: 'https://f841420f888f3c8d80e42f02833e5828.r2.cloudflarestorage.com',
  credentials: {
    accessKeyId: 'fc1c4ef1bd0a1699d0968dd39fbda56b',
    secretAccessKey: '3c7fcbc2128310b4ecd023204c430baf96abf3e453ced4737976725a30720ee7',
  },
})

async function uploadToR2(buffer, key, contentType = 'image/jpeg') {
  const command = new PutObjectCommand({
    Bucket: 'simple-stager-images',
    Key: key,
    Body: buffer,
    ContentType: contentType,
  })

  await r2Client.send(command)
  return `https://f841420f888f3c8d80e42f02833e5828.r2.cloudflarestorage.com/simple-stager-images/${key}`
}

async function migrateProductionToR2() {
  console.log('🔄 Starting PRODUCTION database migration to R2...')
  console.log('✅ Connected to Railway production database')

  // Get all workflows with local image paths from PRODUCTION
  const workflows = await prisma.workflow.findMany({
    where: {
      OR: [
        { sourceImage: { startsWith: '/uploads/' } },
        { thumbnailUrl: { startsWith: '/uploads/' } }
      ]
    },
    include: {
      results: true
    }
  })

  console.log(`📊 Found ${workflows.length} workflows with local images in PRODUCTION`)

  let successCount = 0
  let errorCount = 0

  for (const workflow of workflows) {
    console.log(`\n🔄 Processing workflow: ${workflow.name || workflow.id}`)
    
    try {
      const updates = {}
      
      // Check if we have the local files to upload
      // Migrate source image
      if (workflow.sourceImage && workflow.sourceImage.startsWith('/uploads/')) {
        const localPath = path.join('./apps/web/public', workflow.sourceImage)
        if (fs.existsSync(localPath)) {
          console.log(`  📤 Uploading source image...`)
          const buffer = fs.readFileSync(localPath)
          const r2Key = `workflows/${workflow.id}/original/source.jpg`
          const r2Url = await uploadToR2(buffer, r2Key)
          updates.sourceImage = r2Url
          console.log(`  ✅ Source image uploaded: ${r2Url}`)
        } else {
          console.log(`  ⚠️  Source image not found locally: ${localPath}`)
          // Update to R2 URL anyway (it might already be uploaded)
          const r2Key = `workflows/${workflow.id}/original/source.jpg`
          const r2Url = `https://f841420f888f3c8d80e42f02833e5828.r2.cloudflarestorage.com/simple-stager-images/${r2Key}`
          updates.sourceImage = r2Url
          console.log(`  🔄 Updated to R2 URL: ${r2Url}`)
        }
      }

      // Migrate thumbnail
      if (workflow.thumbnailUrl && workflow.thumbnailUrl.startsWith('/uploads/')) {
        const localPath = path.join('./apps/web/public', workflow.thumbnailUrl)
        if (fs.existsSync(localPath)) {
          console.log(`  📤 Uploading thumbnail...`)
          const buffer = fs.readFileSync(localPath)
          const r2Key = `workflows/${workflow.id}/thumbnail/thumb.jpg`
          const r2Url = await uploadToR2(buffer, r2Key)
          updates.thumbnailUrl = r2Url
          console.log(`  ✅ Thumbnail uploaded: ${r2Url}`)
        } else {
          console.log(`  ⚠️  Thumbnail not found locally: ${localPath}`)
          // Update to R2 URL anyway
          const r2Key = `workflows/${workflow.id}/thumbnail/thumb.jpg`
          const r2Url = `https://f841420f888f3c8d80e42f02833e5828.r2.cloudflarestorage.com/simple-stager-images/${r2Key}`
          updates.thumbnailUrl = r2Url
          console.log(`  🔄 Updated to R2 URL: ${r2Url}`)
        }
      }

      // Update workflow if we have changes
      if (Object.keys(updates).length > 0) {
        await prisma.workflow.update({
          where: { id: workflow.id },
          data: updates
        })
        console.log(`  💾 Workflow updated in PRODUCTION database`)
      }

      // Migrate result images
      for (const result of workflow.results) {
        const resultUpdates = {}
        
        // Migrate watermarked image
        if (result.watermarkedUrl && result.watermarkedUrl.startsWith('/uploads/')) {
          const localPath = path.join('./apps/web/public', result.watermarkedUrl)
          if (fs.existsSync(localPath)) {
            console.log(`  📤 Uploading watermarked result...`)
            const buffer = fs.readFileSync(localPath)
            const r2Key = `workflows/${workflow.id}/staged/watermarked_${result.id}.jpg`
            const r2Url = await uploadToR2(buffer, r2Key)
            resultUpdates.watermarkedUrl = r2Url
            console.log(`  ✅ Watermarked result uploaded: ${r2Url}`)
          } else {
            // Update to R2 URL anyway
            const r2Key = `workflows/${workflow.id}/staged/watermarked_${result.id}.jpg`
            const r2Url = `https://f841420f888f3c8d80e42f02833e5828.r2.cloudflarestorage.com/simple-stager-images/${r2Key}`
            resultUpdates.watermarkedUrl = r2Url
            console.log(`  🔄 Updated watermarked to R2 URL: ${r2Url}`)
          }
        }

        // Migrate full resolution image
        if (result.fullresUrl && result.fullresUrl.startsWith('/uploads/')) {
          const localPath = path.join('./apps/web/public', result.fullresUrl)
          if (fs.existsSync(localPath)) {
            console.log(`  📤 Uploading full resolution result...`)
            const buffer = fs.readFileSync(localPath)
            const r2Key = `workflows/${workflow.id}/staged/fullres_${result.id}.jpg`
            const r2Url = await uploadToR2(buffer, r2Key)
            resultUpdates.fullresUrl = r2Url
            console.log(`  ✅ Full resolution result uploaded: ${r2Url}`)
          } else {
            // Update to R2 URL anyway
            const r2Key = `workflows/${workflow.id}/staged/fullres_${result.id}.jpg`
            const r2Url = `https://f841420f888f3c8d80e42f02833e5828.r2.cloudflarestorage.com/simple-stager-images/${r2Key}`
            resultUpdates.fullresUrl = r2Url
            console.log(`  🔄 Updated fullres to R2 URL: ${r2Url}`)
          }
        }

        // Update result if we have changes
        if (Object.keys(resultUpdates).length > 0) {
          await prisma.result.update({
            where: { id: result.id },
            data: resultUpdates
          })
          console.log(`  💾 Result updated in PRODUCTION database`)
        }
      }

      successCount++
      console.log(`  ✅ Workflow migration completed successfully`)

    } catch (error) {
      errorCount++
      console.error(`  ❌ Error migrating workflow: ${error.message}`)
    }
  }

  console.log(`\n🎉 PRODUCTION Migration completed!`)
  console.log(`✅ Successfully migrated: ${successCount} workflows`)
  console.log(`❌ Failed: ${errorCount} workflows`)
  
  await prisma.$disconnect()
}

// Run the production migration
migrateProductionToR2().catch(console.error)