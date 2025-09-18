#!/bin/bash

# Create R2 S3-compatible access keys using Cloudflare API
# This creates the proper 32-character access keys needed for S3 SDK

ACCOUNT_ID="f841420f888f3c8d80e42f02833e5828"
API_TOKEN="AO5k2VnaMIEOY9-2Q9eZ45ZnJWLiYddsyXCuI1Gf"

echo "🔄 Creating R2 S3-compatible access keys..."

# Create R2 access key pair
curl -X POST "https://api.cloudflare.com/client/v4/user/tokens" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "name": "simple-stager-r2-s3-keys",
    "policies": [
      {
        "effect": "allow", 
        "resources": {
          "com.cloudflare.api.account.'$ACCOUNT_ID'": "*"
        },
        "permission_groups": [
          {
            "id": "c8fed203ed3043cba015a93ad1616f1f",
            "name": "Cloudflare R2:Edit"
          }
        ]
      }
    ]
  }' | jq .

echo ""
echo "✅ R2 access keys created! Use the accessKeyId and secretAccessKey from the response."
echo "📝 These will be the correct 32-character keys for S3 SDK."