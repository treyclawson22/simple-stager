# Cloudflare R2 Cloud Storage Setup Guide

## 🎯 Overview

This guide shows how to set up Cloudflare R2 cloud storage for Simple Stager to replace local file storage. R2 is the most cost-effective solution for image-heavy sites.

## 💰 Why R2?

- **Storage**: $0.015/GB/month (cheapest)
- **Bandwidth**: $0 egress fees (FREE downloads!)
- **Example**: 100GB storage + unlimited bandwidth = **$1.50/month**
- **S3-Compatible**: Easy integration with existing code

## 🔧 Setup Steps

### 1. Create Cloudflare R2 Bucket

1. **Go to**: [Cloudflare Dashboard](https://dash.cloudflare.com) → R2 Object Storage
2. **Create Bucket**: Name it `simple-stager-images`
3. **Location**: Choose closest to your users (usually US)

### 2. Generate API Credentials

1. **Go to**: Profile Icon (top right) → "API Tokens"
2. **Create Token** → "R2 Token" template
3. **Configure Permissions**:
   - Zone: Include All zones
   - Account: Include your account  
   - R2: Edit permissions for your bucket

### 3. Get Required Information

After creating the token, collect:
- **Account ID**: Found in R2 overview page (right sidebar)
- **Access Key ID**: From token creation
- **Secret Access Key**: From token creation  
- **Bucket Name**: `simple-stager-images`

## 🚀 Environment Variables

Add these to Railway → Variables:

```bash
# Cloudflare R2 Configuration
R2_ACCOUNT_ID=your-account-id-here
R2_ACCESS_KEY_ID=your-access-key-here
R2_SECRET_ACCESS_KEY=your-secret-key-here
R2_BUCKET_NAME=simple-stager-images
```

## 📁 File Structure

R2 will organize files like this:
```
simple-stager-images/
├── workflows/
│   ├── workflow-id-1/
│   │   ├── original/
│   │   │   └── 1726654321_source.jpg
│   │   ├── staged/
│   │   │   └── 1726654322_enhanced.jpg
│   │   └── thumbnail/
│   │       └── 1726654321_thumb.jpg
│   └── workflow-id-2/
│       └── ...
```

## 🔄 How It Works

1. **Automatic Fallback**: If R2 credentials are missing, falls back to local storage
2. **Parallel Upload**: Source images and thumbnails upload simultaneously  
3. **Public URLs**: Images get public R2 URLs for fast access
4. **Cost Tracking**: All downloads are FREE (no egress charges)

## 🧪 Testing

After setting up environment variables:

1. **Check Integration**: Upload a test image
2. **Verify URLs**: Images should have R2 URLs like:
   ```
   https://simple-stager-images.ACCOUNT-ID.r2.cloudflarestorage.com/workflows/...
   ```
3. **Performance**: Images should load from global CDN

## 📊 Monitoring

Watch Railway logs for:
```bash
✅ R2 Upload Success: workflows/.../original/123_source.jpg -> https://...
📸 Image Upload Results:
  Source: https://... (R2)
  Thumbnail: https://... (R2)
```

## 🔧 Troubleshooting

### Problem: Images still using local storage
**Solution**: Check Railway environment variables are set correctly

### Problem: R2 upload errors
**Solution**: Verify API token permissions include "Edit" for your bucket

### Problem: Images not loading
**Solution**: Check bucket is configured for public access

## 💡 Migration Strategy

**Phase 1**: New uploads go to R2 (existing images stay local)
**Phase 2**: Gradually migrate existing images to R2
**Phase 3**: Remove local storage fallback

## 🎯 Next Steps

1. **Set up R2 bucket and credentials** ← You are here
2. **Add environment variables to Railway**
3. **Deploy and test image uploads**
4. **Monitor performance and costs**
5. **Migrate existing images** (optional)

## 📈 Expected Results

- **99% Cost Reduction** vs AWS S3 + CloudFront
- **Global CDN Performance** for image delivery
- **Unlimited Bandwidth** with zero surprise bills
- **S3 Compatibility** for easy future migration

---

**Ready to proceed once you have the R2 API credentials!**