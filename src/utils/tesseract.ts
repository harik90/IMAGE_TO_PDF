import { createWorker } from 'tesseract.js';

export async function runOcrOnImage(
  imageSource: string | HTMLCanvasElement | Blob,
  lang: string = 'eng',
  onProgress?: (progress: number, status: string) => void
): Promise<string> {
  const worker = await createWorker(lang, 1, {
    workerPath: '/tesseract/worker.min.js',
    corePath: '/tesseract/tesseract-core-lstm.wasm.js',
    langPath: '/tesseract/lang-data',
    logger: m => {
      if (m.status === 'recognizing text' && typeof m.progress === 'number') {
        onProgress?.(Math.round(m.progress * 100), 'Recognizing characters...');
      } else if (m.status) {
        onProgress?.(0, m.status);
      }
    }
  });

  try {
    const { data: { text } } = await worker.recognize(imageSource);
    return text.trim();
  } finally {
    await worker.terminate();
  }
}

export function preprocessImageForOcr(
  canvas: HTMLCanvasElement,
  options: { grayscale?: boolean; contrast?: boolean }
): HTMLCanvasElement {
  if (!options.grayscale && !options.contrast) return canvas;

  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // Grayscale luminance
    let gray = 0.299 * r + 0.587 * g + 0.114 * b;

    // High contrast thresholding if contrast option selected
    if (options.contrast) {
      gray = gray > 140 ? 255 : 0;
    }

    data[i] = gray;
    data[i + 1] = gray;
    data[i + 2] = gray;
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas;
}
