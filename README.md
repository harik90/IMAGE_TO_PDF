# image_to_pdf

a 100% client-side, zero-telemetry multi-tool web utility for images and pdfs.

## why

conventional online file converters upload personal scans, invoices, and sensitive documents to third-party servers. image_to_pdf runs entirely in memory inside your browser using wasm and canvas, ensuring absolute privacy and instantaneous throughput.

## run

```bash
npm install
npm run dev
```

build for production:
```bash
npm run build
npm run preview
```

## add a tool

1. create your component in `src/tools/YourTool.tsx` using `ToolLayout` and `Dropzone`.
2. register it in `src/tools/registry.tsx` with `id`, `name`, `description`, `keywords`, `icon`, `route`, and `component`.
3. the home grid, search index, command palette (`⌘K`), and router update automatically.
