# image_to_pdf

quiet craft client-side image and pdf utilities without cloud uploads.

live app: https://harik90.github.io/IMAGE_TO_PDF/

## why

most online file converters quietly upload your personal scans, tax documents, and receipts to unknown remote servers. i built image_to_pdf to run every conversion, merge, compression, and ocr pass entirely inside local browser memory using wasm and canvas. your bytes never touch a cloud server.

## run

```bash
npm install
npm run dev
```

to build for production:

```bash
npm run build
npm run preview
```

## license

mit
