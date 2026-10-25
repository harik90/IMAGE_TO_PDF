# image to pdf

a quiet, client-side web utility to compile images into clean pdf documents.

## why

most online image-to-pdf converters upload personal scans and photos to unknown third-party servers with upload limits and watermark spam. this tool runs completely inside your browser using canvas and jspdf, ensuring zero network transmission and instantaneous page layout control.

## run

serve the directory with any local static server:

```bash
# python
python -m http.server 8080

# node
npx serve .
```

or open `index.html` directly in any modern browser.
