# image_to_pdf

quiet craft client-side image and pdf utilities without cloud uploads.

## why

most online file converters quietly upload your personal scans, tax documents, and receipts to unknown remote servers. i built image_to_pdf to do every conversion, merge, and ocr pass entirely inside browser memory using wasm and canvas. your bytes never leave your machine.

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
