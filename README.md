# image-to-pdf

a tactile client-side image sequence to pdf compiler with zero telemetry.

## why

most pdf converters upload your scans and private images to remote servers with hidden rate limits or compress them into blurry artifacts. i wanted a quiet utility that works entirely in your local browser memory, preserves full dynamic range, and gives you tactile control over page sequencing without any friction.

## run

serve the directory with any local static server:

```bash
# python
python -m http.server 8080

# node
npx serve .
```

open `http://localhost:8080` in your browser.

## license

mit
