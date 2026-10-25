import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          'pdflib': ['pdf-lib'],
          'pdfjs': ['pdfjs-dist'],
          'tesseract': ['tesseract.js'],
          'fflate': ['fflate']
        }
      }
    }
  },
  worker: {
    format: 'es'
  },
  server: {
    port: 5173
  }
});
