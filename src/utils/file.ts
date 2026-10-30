import { zipSync } from 'fflate';

export function getPublicAssetUrl(relativePath: string): string {
  if (typeof window === 'undefined') return relativePath;
  const cleanRel = relativePath.replace(/^\.?\//, '');
  const baseUri = document.baseURI || window.location.href;
  try {
    const u = new URL(baseUri);
    let dir = u.pathname;
    if (!dir.endsWith('/')) {
      if (!dir.includes('.')) {
        dir = `${dir}/`;
      } else {
        dir = dir.substring(0, dir.lastIndexOf('/') + 1) || '/';
      }
    }
    return new URL(cleanRel, `${u.origin}${dir}`).href;
  } catch {
    return cleanRel;
  }
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function revokeUrl(url?: string): void {
  if (url && url.startsWith('blob:')) {
    try {
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    }
  }
}

export function validateFileSize(file: File, maxMb = 50): { valid: boolean; error?: string } {
  const maxBytes = maxMb * 1024 * 1024;
  if (file.size > maxBytes) {
    return {
      valid: false,
      error: `"${file.name}" exceeds the ${maxMb} MB limit (${formatBytes(file.size)}). Please choose a smaller file.`
    };
  }
  return { valid: true };
}

export function validateFileType(file: File, acceptedMimes: string[], acceptedExts: string[]): { valid: boolean; error?: string } {
  const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
  const mimeMatches = acceptedMimes.some(mime => {
    if (mime.endsWith('/*')) {
      const prefix = mime.split('/')[0];
      return file.type.startsWith(prefix + '/');
    }
    return file.type === mime;
  });
  const extMatches = acceptedExts.includes(fileExt);

  if (!mimeMatches && !extMatches) {
    return {
      valid: false,
      error: `Unsupported file type: "${file.name}". Supported formats: ${acceptedExts.join(', ')}`
    };
  }
  return { valid: true };
}

export function sanitizeFilename(name: string, fallback = 'document'): string {
  if (!name) return fallback;
  const cleaned = name
    .replace(/[\0\r\n\t]/g, '')
    .replace(/[/\\]+/g, '_')
    .replace(/^\.+/, '')
    .trim();
  return cleaned || fallback;
}

export function downloadBlob(blob: Blob, filename: string): void {
  const safeName = sanitizeFilename(filename);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = safeName;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

export async function downloadZip(files: { [filename: string]: Uint8Array }, zipName: string): Promise<void> {
  const sanitizedFiles: { [filename: string]: Uint8Array } = {};
  for (const [key, val] of Object.entries(files)) {
    const safeKey = sanitizeFilename(key, 'file');
    sanitizedFiles[safeKey] = val;
  }
  const safeZipName = sanitizeFilename(zipName, 'archive.zip');
  const zipped = zipSync(sanitizedFiles);
  const blob = new Blob([zipped as any], { type: 'application/zip' });
  downloadBlob(blob, safeZipName);
}
