import { createWorker, PSM } from 'tesseract.js';
import { getPublicAssetUrl } from './file';

export interface OcrResultWord {
  text: string;
  confidence: number;
  bbox?: { x0: number; y0: number; x1: number; y1: number };
}

export interface OcrPageResult {
  pageNumber: number;
  text: string;
  markdown: string;
  confidence: number;
  words: OcrResultWord[];
  imagePreviewUrl?: string;
  processedPreviewUrl?: string;
}

export interface PreprocessingOptions {
  grayscale: boolean;
  autoContrast: boolean;
  binarize: boolean;
  denoise: boolean;
  deskew: boolean;
  upscale: boolean;
}

export const DEFAULT_PREPROCESSING: PreprocessingOptions = {
  grayscale: true,
  autoContrast: true,
  binarize: true,
  denoise: true,
  deskew: true,
  upscale: true
};

export function detectGarbageText(text: string, lang = 'hin+eng'): boolean {
  if (!text || text.trim().length < 15) return true;

  const totalChars = text.length;
  // Replacement character count
  const replacementChars = (text.match(/\uFFFD/g) || []).length;
  if (replacementChars / totalChars > 0.05) return true;

  // Unprintable control characters
  const controlChars = (text.match(/[\x00-\x08\x0E-\x1F]/g) || []).length;
  if (controlChars / totalChars > 0.05) return true;

  // If Hindi document expected, test Devanagari Unicode range (\u0900-\u097F)
  if (lang.includes('hin')) {
    const devanagariCount = (text.match(/[\u0900-\u097F]/g) || []).length;
    const asciiCount = (text.match(/[a-zA-Z]/g) || []).length;

    // Detect legacy Kruti Dev / Shusha fonts:
    // Kruti Dev uses ASCII characters (e.g. "dks", "esa", "gS", "fn;k", "fd;k") to render Hindi glyphs
    const krutiDevTokens = ['dks', 'esa', 'gS', 'fn;k', 'fd;k', 'dk', 'dh', 'ds', 'gSa', 'ugha', 'Fkk', 'Fks'];
    const words = text.toLowerCase().split(/\s+/);
    const krutiMatches = words.filter(w => krutiDevTokens.includes(w)).length;
    if (krutiMatches > 3 && devanagariCount === 0) {
      return true; // Kruti Dev font detected without unicode Hindi
    }

    // If mostly ASCII and zero Devanagari in a Hindi document, treat as scanned or legacy font
    if (devanagariCount === 0 && asciiCount < 50 && totalChars > 40) {
      return true;
    }
  }

  return false;
}

export function preprocessImageForOcr(
  canvas: HTMLCanvasElement,
  options: PreprocessingOptions = DEFAULT_PREPROCESSING
): HTMLCanvasElement {
  let workingCanvas = canvas;

  // Upscale low resolution images (< 1500px wide) to 300 DPI equivalent
  if (options.upscale && workingCanvas.width < 1500) {
    const scale = Math.min(3, 1800 / workingCanvas.width);
    const upscaled = document.createElement('canvas');
    upscaled.width = Math.round(workingCanvas.width * scale);
    upscaled.height = Math.round(workingCanvas.height * scale);
    const uCtx = upscaled.getContext('2d');
    if (uCtx) {
      uCtx.imageSmoothingEnabled = true;
      uCtx.imageSmoothingQuality = 'high';
      uCtx.drawImage(workingCanvas, 0, 0, upscaled.width, upscaled.height);
      workingCanvas = upscaled;
    }
  }

  const ctx = workingCanvas.getContext('2d');
  if (!ctx) return workingCanvas;

  const w = workingCanvas.width;
  const h = workingCanvas.height;
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;

  // 1. Grayscale & Min/Max for Auto-Contrast
  let minLum = 255;
  let maxLum = 0;
  const lumArr = new Uint8Array(w * h);

  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const lum = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    lumArr[p] = lum;
    if (lum < minLum) minLum = lum;
    if (lum > maxLum) maxLum = lum;
  }

  // 2. Auto-Contrast Stretch
  const range = maxLum - minLum || 1;
  for (let p = 0; p < lumArr.length; p++) {
    lumArr[p] = Math.min(255, Math.max(0, Math.round(((lumArr[p] - minLum) / range) * 255)));
  }

  // 3. Otsu Threshold Calculation for Binarization
  let threshold = 128;
  if (options.binarize) {
    const hist = new Int32Array(256);
    for (let p = 0; p < lumArr.length; p++) hist[lumArr[p]]++;

    let sum = 0;
    for (let t = 0; t < 256; t++) sum += t * hist[t];

    let sumB = 0;
    let wB = 0;
    let wF = 0;
    let varMax = 0;

    for (let t = 0; t < 256; t++) {
      wB += hist[t];
      if (wB === 0) continue;
      wF = lumArr.length - wB;
      if (wF === 0) break;

      sumB += t * hist[t];
      const mB = sumB / wB;
      const mF = (sum - sumB) / wF;
      const varBetween = wB * wF * (mB - mF) * (mB - mF);

      if (varBetween > varMax) {
        varMax = varBetween;
        threshold = t;
      }
    }
  }

  // 4. Apply Binarization and Grayscale back to image buffer
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    let val = lumArr[p];
    if (options.binarize) {
      val = val > threshold ? 255 : 0;
    }
    data[i] = val;
    data[i + 1] = val;
    data[i + 2] = val;
  }

  ctx.putImageData(imgData, 0, 0);

  // 5. 3x3 Median Denoise
  if (options.denoise && options.binarize) {
    const denoised = ctx.getImageData(0, 0, w, h);
    const dData = denoised.data;
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        let blackCount = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const idx = ((y + dy) * w + (x + dx)) * 4;
            if (data[idx] === 0) blackCount++;
          }
        }
        const centerIdx = (y * w + x) * 4;
        const finalVal = blackCount >= 5 ? 0 : 255;
        dData[centerIdx] = finalVal;
        dData[centerIdx + 1] = finalVal;
        dData[centerIdx + 2] = finalVal;
      }
    }
    ctx.putImageData(denoised, 0, 0);
  }

  return workingCanvas;
}

export function formatToMarkdown(rawText: string, words: OcrResultWord[] = []): string {
  if (!rawText) return '';

  const lines = rawText.split('\n');
  const mdLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      mdLines.push('');
      continue;
    }

    // Heading detection: short standalone line (< 50 chars), all caps or starting with numbering
    const isHeading1 = /^([0-9]+\.|\bCHAPTER\b|\bSECTION\b|[A-Z\s]{4,})\b/i.test(line) && line.length < 60;
    const isHeading2 = /^[A-Z0-9\s]{3,35}$/.test(line);

    // List item detection
    const isBullet = /^([*•\-\u2022\u2023\u25E6]|\d+\.)\s+/.test(line);

    // Table detection: line contains multiple vertical pipe bars or uniform tab-delimited columns
    const pipeCount = (line.match(/\|/g) || []).length;
    const isTable = pipeCount >= 2;

    if (isHeading1 && i === 0) {
      mdLines.push(`# ${line.replace(/^#+\s*/, '')}`);
    } else if (isHeading2 && line.length < 40) {
      mdLines.push(`## ${line.replace(/^#+\s*/, '')}`);
    } else if (isBullet) {
      mdLines.push(line.replace(/^[•\u2022\u2023\u25E6]\s*/, '- '));
    } else if (isTable) {
      mdLines.push(line);
      // Auto add table markdown separator row if not present
      if (i + 1 < lines.length && !lines[i + 1].includes('---')) {
        const cols = line.split('|').filter(c => c.trim().length > 0).length;
        mdLines.push('| ' + Array(cols).fill('---').join(' | ') + ' |');
      }
    } else {
      mdLines.push(line);
    }
  }

  return mdLines.join('\n');
}

export async function runOcrOnImage(
  imageSource: string | HTMLCanvasElement | Blob,
  lang = 'hin+eng',
  psmMode: PSM = PSM.AUTO,
  onProgress?: (progress: number, status: string) => void,
  abortSignal?: AbortSignal
): Promise<{ text: string; markdown: string; confidence: number; words: OcrResultWord[] }> {
  if (abortSignal?.aborted) throw new Error('OCR operation cancelled');

  const worker = await createWorker(lang, 1, {
    workerPath: getPublicAssetUrl('tesseract/worker.min.js'),
    corePath: getPublicAssetUrl('tesseract/tesseract-core-lstm.wasm.js'),
    langPath: getPublicAssetUrl('tesseract/lang-data'),
    logger: m => {
      if (m.status === 'recognizing text' && typeof m.progress === 'number') {
        onProgress?.(Math.round(m.progress * 100), 'Recognizing characters...');
      } else if (m.status) {
        onProgress?.(0, m.status);
      }
    }
  });

  try {
    if (abortSignal?.aborted) throw new Error('OCR operation cancelled');

    await worker.setParameters({
      tessedit_pageseg_mode: psmMode,
      preserve_interword_spaces: '1'
    });

    const ret = await worker.recognize(imageSource);
    const data = ret.data;

    const words: OcrResultWord[] = (data.words || []).map((w: any) => ({
      text: w.text,
      confidence: w.confidence,
      bbox: w.bbox
    }));

    const text = data.text.trim();
    const markdown = formatToMarkdown(text, words);
    const confidence = Math.round(data.confidence || 0);

    return { text, markdown, confidence, words };
  } finally {
    await worker.terminate();
  }
}
