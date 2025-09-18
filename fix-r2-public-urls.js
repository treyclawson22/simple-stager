const { PrismaClient } = require('@prisma/client')

// Use Railway production database
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:zQViwzixCJlzFQDxeIxWOmsWMpkCDYya@crossover.proxy.rlwy.net:28966/railway"
    }
  }
})

async function fixR2PublicUrls() {
  console.log('🔄 Updating all R2 URLs to use public domain...')
  
  const oldDomain = 'https://f841420f888f3c8d80e42f02833e5828.r2.cloudflarestorage.com/simple-stager-images/'
  const newDomain = 'https://pub-71859b8870504fed8f18385e91b192d3.r2.dev/'
  
  // Update workflows
  const workflowUpdates = await prisma.workflow.updateMany({
    where: {
      OR: [
        { sourceImage: { startsWith: oldDomain } },
        { thumbnailUrl: { startsWith: oldDomain } }
      ]
    },
    data: {}
  })
  
  // Get all workflows that need URL updates
  const workflows = await prisma.workflow.findMany({
    where: {
      OR: [
        { sourceImage: { startsWith: oldDomain } },
        { thumbnailUrl: { startsWith: oldDomain } }
      ]
    }
  })
  
  console.log(`📊 Found ${workflows.length} workflows to update`)
  
  for (const workflow of workflows) {
    const updates = {}
    
    if (workflow.sourceImage && workflow.sourceImage.startsWith(oldDomain)) {
      updates.sourceImage = workflow.sourceImage.replace(oldDomain, newDomain)
    }
    
    if (workflow.thumbnailUrl && workflow.thumbnailUrl.startsWith(oldDomain)) {
      updates.thumbnailUrl = workflow.thumbnailUrl.replace(oldDomain, newDomain)
    }
    
    if (Object.keys(updates).length > 0) {
      await prisma.workflow.update({
        where: { id: workflow.id },
        data: updates
      })
      console.log(`✅ Updated workflow ${workflow.name || workflow.id}`)
      console.log(`   Source: ${updates.sourceImage || 'no change'}`)
      console.log(`   Thumb: ${updates.thumbnailUrl || 'no change'}`)
    }
  }
  
  // Update results
  const results = await prisma.result.findMany({
    where: {
      OR: [
        { watermarkedUrl: { startsWith: oldDomain } },
        { fullresUrl: { startsWith: oldDomain } }
      ]
    }
  })
  
  console.log(`📊 Found ${results.length} results to update`)
  
  for (const result of results) {
    const updates = {}
    
    if (result.watermarkedUrl && result.watermarkedUrl.startsWith(oldDomain)) {
      updates.watermarkedUrl = result.watermarkedUrl.replace(oldDomain, newDomain)
    }
    
    if (result.fullresUrl && result.fullresUrl.startsWith(oldDomain)) {
      updates.fullresUrl = result.fullresUrl.replace(oldDomain, newDomain)
    }
    
    if (Object.keys(updates).length > 0) {
      await prisma.result.update({
        where: { id: result.id },
        data: updates
      })
      console.log(`✅ Updated result ${result.id}`)
      console.log(`   Watermarked: ${updates.watermarkedUrl || 'no change'}`)
      console.log(`   Fullres: ${updates.fullresUrl || 'no change'}`)
    }
  }
  
  console.log('\n🎉 All URLs updated to use public R2 domain!')
  
  await prisma.$disconnect()
}

fixR2PublicUrls().catch(console.error)