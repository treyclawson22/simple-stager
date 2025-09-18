#!/bin/bash

# Create R2 API token using your existing API token
ACCOUNT_ID="f841420f888f3c8d80e42f02833e5828"
API_TOKEN="AO5k2VnaMIEOY9-2Q9eZ45ZnJWLiYddsyXCuI1Gf"

echo "🔄 Creating R2 API token via Cloudflare API..."

# Create R2 token with Object Read & Write permissions
curl -X POST "https://api.cloudflare.com/client/v4/user/tokens" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "name": "simple-stager-r2-s3",
    "policies": [
      {
        "effect": "allow",
        "resources": {
          "com.cloudflare.api.account.'$ACCOUNT_ID':*": "*"
        },
        "permission_groups": [
          {
            "id": "c8fed203ed3043cba015a93ad1616f1f"
          }
        ]
      }
    ]
  }' | jq .

echo ""
echo "✅ If successful, use the 'value' field as your API token"