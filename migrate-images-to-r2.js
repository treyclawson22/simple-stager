const { PrismaClient } = require('@prisma/client')
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

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

async function migrateImagesToR2() {
  console.log('🔄 Starting image migration to R2...')
  
  console.log('✅ R2 credentials hardcoded - ready to migrate!')

  // Get all workflows with local image paths
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

  console.log(`📊 Found ${workflows.length} workflows with local images`)

  let successCount = 0
  let errorCount = 0

  for (const workflow of workflows) {
    console.log(`\n🔄 Processing workflow: ${workflow.name || workflow.id}`)
    
    try {
      const updates = {}
      
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
          console.log(`  ⚠️  Source image not found: ${localPath}`)
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
          console.log(`  ⚠️  Thumbnail not found: ${localPath}`)
        }
      }

      // Update workflow if we have changes
      if (Object.keys(updates).length > 0) {
        await prisma.workflow.update({
          where: { id: workflow.id },
          data: updates
        })
        console.log(`  💾 Workflow updated in database`)
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
          }
        }

        // Update result if we have changes
        if (Object.keys(resultUpdates).length > 0) {
          await prisma.result.update({
            where: { id: result.id },
            data: resultUpdates
          })
          console.log(`  💾 Result updated in database`)
        }
      }

      successCount++
      console.log(`  ✅ Workflow migration completed successfully`)

    } catch (error) {
      errorCount++
      console.error(`  ❌ Error migrating workflow: ${error.message}`)
    }
  }

  console.log(`\n🎉 Migration completed!`)
  console.log(`✅ Successfully migrated: ${successCount} workflows`)
  console.log(`❌ Failed: ${errorCount} workflows`)
  
  await prisma.$disconnect()
}

// Run the migration
migrateImagesToR2().catch(console.error)