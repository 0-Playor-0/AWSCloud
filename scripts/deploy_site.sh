#!/usr/bin/env bash
# Build the frontend against the deployed API and publish it to the private site bucket.
#   scripts/deploy_site.sh            # after `sam deploy`
# Cache rules: hashed assets/* and versioned ocr/<versions>/* are immutable for a year;
# index.html and other top-level files are revalidated on every load.
set -euo pipefail
cd "$(dirname "$0")/.."
source scripts/region.sh
export AWS_PAGER=""
STACK=namma-check
out() { aws cloudformation describe-stacks --stack-name "$STACK" \
  --query "Stacks[0].Outputs[?OutputKey=='$1'].OutputValue" --output text; }
API_URL=$(out ApiUrl); BUCKET=$(out SiteBucketName); DIST=$(out DistributionId); SITE=$(out SiteUrl)

(cd frontend && npm ci --silent && VITE_API_URL="$API_URL" npm run build)

LONG="public,max-age=31536000,immutable"
aws s3 sync frontend/dist/assets "s3://$BUCKET/assets" --delete --cache-control "$LONG"
# The OCR model is gzip data that Tesseract decompresses itself: no Content-Encoding header.
aws s3 sync frontend/dist/ocr "s3://$BUCKET/ocr" --delete --cache-control "$LONG" \
  --exclude "*.gz"
aws s3 sync frontend/dist/ocr "s3://$BUCKET/ocr" --delete --cache-control "$LONG" \
  --exclude "*" --include "*.gz" --content-type application/octet-stream
aws s3 sync frontend/dist "s3://$BUCKET" --delete --cache-control "no-cache" \
  --exclude "assets/*" --exclude "ocr/*"
aws cloudfront create-invalidation --distribution-id "$DIST" --paths "/index.html" "/favicon.svg" \
  --query 'Invalidation.Status' --output text
echo "site: $SITE"
