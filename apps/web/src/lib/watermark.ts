import sharp from 'sharp'
import { join } from 'path'

export async function addWatermark(imagePath: string, outputPath?: string): Promise<string> {
  try {
    const finalOutputPath = outputPath || imagePath.replace(/\.(jpg|jpeg|png)$/i, '_watermarked.$1')

    // Get image dimensions
    const metadata = await sharp(imagePath).metadata()
    const width = metadata.width || 1024
    const height = metadata.height || 1024

    // Calculate font size based on image dimensions
    const fontSize = Math.max(20, Math.floor(width * 0.02))
    
    // Create watermark text
    const watermarkText = 'Simple Stager'
    
    // Calculate diagonal spacing - text should repeat across the diagonal
    const diagonalLength = Math.sqrt(width * width + height * height)
    const textSpacing = Math.max(200, Math.floor(diagonalLength / 8)) // Space between text instances
    
    // Create repeating diagonal watermark pattern
    const watermarkSvg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="watermarkPattern" x="0" y="0" width="${textSpacing}" height="${textSpacing}" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
            <text 
              x="50%" 
              y="50%" 
              text-anchor="middle" 
              dominant-baseline="middle" 
              fill="rgba(255,255,255,0.15)" 
              font-family="Arial, sans-serif" 
              font-size="${fontSize}" 
              font-weight="bold"
            >${watermarkText}</text>
          </pattern>
          
          <!-- Add diagonal lines -->
          <pattern id="linePattern" x="0" y="0" width="${textSpacing * 0.3}" height="${textSpacing * 0.3}" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
            <line x1="0" y1="50%" x2="100%" y2="50%" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
          </pattern>
        </defs>
        
        <!-- Apply diagonal lines -->
        <rect x="0" y="0" width="100%" height="100%" fill="url(#linePattern)"/>
        
        <!-- Apply text pattern -->
        <rect x="0" y="0" width="100%" height="100%" fill="url(#watermarkPattern)"/>
      </svg>
    `

    // Apply watermark to image
    await sharp(imagePath)
      .composite([{
        input: Buffer.from(watermarkSvg),
        top: 0,
        left: 0,
        blend: 'over'
      }])
      .jpeg({ quality: 90 })
      .toFile(finalOutputPath)

    return finalOutputPath

  } catch (error) {
    console.error('Watermarking error:', error)
    // If watermarking fails, return original path
    return imagePath
  }
}

export async function removeWatermark(imagePath: string, outputPath?: string): Promise<string> {
  try {
    // For now, this is a placeholder
    // In a real implementation, you would:
    // 1. Use the original un-watermarked image stored separately
    // 2. Or use advanced image processing to remove watermarks
    // 3. Or regenerate the image without watermark
    
    const finalOutputPath = outputPath || imagePath.replace(/watermarked_/g, '').replace(/\.(jpg|jpeg|png)$/i, '_clean.$1')
    
    // For development, just copy the image (in production you'd use the clean original)
    await sharp(imagePath)
      .jpeg({ quality: 95 })
      .toFile(finalOutputPath)
    
    return finalOutputPath
    
  } catch (error) {
    console.error('Watermark removal error:', error)
    return imagePath
  }
}

export async function createThumbnail(imagePath: string, size: number = 200): Promise<string> {
  try {
    const thumbnailPath = imagePath.replace(/\.(jpg|jpeg|png)$/i, '_thumb.$1')
    
    await sharp(imagePath)
      .resize(size, size, { 
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 80 })
      .toFile(thumbnailPath)
    
    return thumbnailPath
    
  } catch (error) {
    console.error('Thumbnail creation error:', error)
    return imagePath
  }
}