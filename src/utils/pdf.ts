import * as pdfjsLib from 'pdfjs-dist';

if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.mjs';
}

export async function loadPdfDocument(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      cMapPacked: true
    });
    return await loadingTask.promise;
  } catch (err: any) {
    throw new Error('This PDF is locked or damaged. Remove the password and try again.');
  }
}

export async function extractTextFromPdfPage(pdfPage: any): Promise<string> {
  const textContent = await pdfPage.getTextContent();
  const items = textContent.items as Array<{ str: string; transform: number[] }>;

  if (!items || items.length === 0) return '';

  const lines: { y: number; text: string }[] = [];
  const lineThreshold = 5;

  for (const item of items) {
    const y = item.transform[5];
    const str = item.str;
    if (!str.trim()) continue;

    const existingLine = lines.find(l => Math.abs(l.y - y) <= lineThreshold);
    if (existingLine) {
      existingLine.text += ' ' + str;
    } else {
      lines.push({ y, text: str });
    }
  }

  lines.sort((a, b) => b.y - a.y);
  return lines.map(l => l.text.trim()).join('\n');
}

export async function renderPdfPageToCanvas(pdfPage: any, scaleOrDpi: number = 2.0): Promise<HTMLCanvasElement> {
  // If scaleOrDpi > 10, treat as DPI (e.g. 150, 300 -> 300/72 = 4.167). Otherwise treat as direct scale factor (e.g. 1.0, 2.0, 3.0)
  let scale = scaleOrDpi > 10 ? scaleOrDpi / 72 : scaleOrDpi;

  // Ensure minimum scale of 1.0 so pages are never downsampled to microscopic blur
  if (scale < 1.0) scale = 1.0;

  const initialViewport = pdfPage.getViewport({ scale });

  // Cap maximum dimension to 4096px for browser memory stability
  const maxDim = 4096;
  if (initialViewport.width > maxDim || initialViewport.height > maxDim) {
    const ratio = Math.min(maxDim / initialViewport.width, maxDim / initialViewport.height);
    scale = scale * ratio;
  }

  const viewport = pdfPage.getViewport({ scale });
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);

  if (!context) throw new Error('Could not get canvas 2D context');

  // Fill canvas with white background for transparency
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);

  await pdfPage.render({
    canvasContext: context,
    viewport: viewport
  }).promise;

  return canvas;
}
