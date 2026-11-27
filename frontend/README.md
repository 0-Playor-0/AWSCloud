# Namma Check frontend

The newspaper-style React + Vite frontend for Namma Check.

## Privacy model

- Photos are read with self-hosted Tesseract.js in the browser and are never uploaded.
- Long identifier-like numbers are removed on the device.
- Only text the user selects and explicitly consents to send is posted to `/v1/extract`.
- Confirmed fields are posted to `/v1/compare`; anonymous counts are read from `/v1/stats`.

## Local development

Requirements: Node.js 22 and Python 3.14 for the local API.

```bash
npm ci
../.venv/bin/python ../scripts/local_api.py  # from another terminal
npm run dev
```

Vite proxies `/v1/*` to `http://127.0.0.1:8787`. Set `LOCAL_API` to use another local API origin.

## Checks

```bash
npm test
npm run lint
npm run build
```

The build copies the self-hosted Tesseract worker, WebAssembly cores, and English model into
`public/ocr/` before Vite bundles the site. Generated OCR assets and `dist/` are ignored by Git.

For a production build, set `VITE_API_URL` to the deployed API origin:

```bash
VITE_API_URL="https://example.execute-api.ap-southeast-2.amazonaws.com" npm run build
```

The repository-level `scripts/deploy_site.sh` performs the production build and publishes it to
the private S3 bucket behind CloudFront.
