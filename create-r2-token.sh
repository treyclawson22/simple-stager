#!/bin/bash

# Cloudflare R2 API Token Creation Script
# This creates an API token with R2 permissions for SimpleStager

# You need to fill in these values:
ACCOUNT_ID="YOUR_ACCOUNT_ID_HERE"  # Get from Cloudflare dashboard
GLOBAL_API_KEY="YOUR_GLOBAL_API_KEY_HERE"  # From My Profile → API Tokens → Global API Key
EMAIL="YOUR_CLOUDFLARE_EMAIL_HERE"  # Your Cloudflare account email

# Create R2 API token
echo "Creating Cloudflare R2 API token for SimpleStager..."

curl -X POST "https://api.cloudflare.com/client/v4/user/tokens" \
  -H "X-Auth-Email: $EMAIL" \
  -H "X-Auth-Key: $GLOBAL_API_KEY" \
  -H "Content-Type: application/json" \
  --data '{
    "name": "SimpleStager-R2-Storage",
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
    ],
    "condition": {},
    "not_before": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
    "expires_on": "'$(date -u -d '+1 year' +%Y-%m-%dT%H:%M:%SZ)'"
  }' | jq .

echo ""
echo "✅ Token created! Copy the 'value' field - this is your R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY"
echo "📝 Your Account ID: $ACCOUNT_ID"
echo "📝 Your Bucket Name: simple-stager-images"