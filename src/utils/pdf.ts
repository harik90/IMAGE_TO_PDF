import * as pdfjsLib from 'pdfjs-dist';

// Point to self-hosted worker in public/pdfjs/
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.mjs';
}

export async function loadPdfDocument(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      cMapUrl: undefined,
      cMapPacked: true
    });
    return await loadingTask.promise;
  } catch (err: any) {
    if (err?.name === 'PasswordException' || err?.message?.toLowerCase().includes('password')) {
      throw new Error('This PDF is locked or damaged. Remove the password and try again.');
    }
    throw new Error('This PDF is locked or damaged. Remove the password and try again.');
  }
}

export async function extractTextFromPdfPage(pdfPage: any): Promise<string> {
  const textContent = await pdfPage.getTextContent();
  const items = textContent.items as Array<{ str: string; transform: number[] }>;

  if (!items || items.length === 0) return '';

  // Sort items primarily by Y descending (top to bottom), then X ascending (left to right)
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

  // Sort top-to-bottom
  lines.sort((a, b) => b.y - a.y);
  return lines.map(l => l.text.trim()).join('\n');
}

export async function renderPdfPageToCanvas(pdfPage: any, scale = 2.0): Promise<HTMLCanvasElement> {
  const viewport = pdfPage.getViewport({ scale });
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);

  if (!context) throw new Error('Could not get canvas 2D context');

  // Fill with white background
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);

  await pdfPage.render({
    canvasContext: context,
    viewport: viewport
  }).promise;

  return canvas;
}
