import React, { useState, useEffect } from 'react';
import { ToolLayout } from '../components/ToolLayout';
import { Dropzone } from '../components/Dropzone';
import { formatBytes, validateFileSize, validateFileType, downloadBlob, revokeUrl } from '../utils/file';
import { loadPdfDocument, renderPdfPageToCanvas } from '../utils/pdf';
import { Image, Sliders, Play, FileDown, CheckCircle2 } from 'lucide-react';
import { zipSync } from 'fflate';

function parsePageRange(rangeStr: string, maxPages: number): number[] {
  if (!rangeStr.trim()) return Array.from({ length: maxPages }, (_, i) => i + 1);
  const pages = new Set<number>();
  const parts = rangeStr.split(',');
  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.includes('-')) {
      const [startStr, endStr] = trimmed.split('-');
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      if (!isNaN(start) && !isNaN(end)) {
        for (let i = Math.max(1, start); i <= Math.min(maxPages, end); i++) {
          pages.add(i);
        }
      }
    } else {
      const p = parseInt(trimmed, 10);
      if (!isNaN(p) && p >= 1 && p <= maxPages) {
        pages.add(p);
      }
    }
  }
  const result = Array.from(pages).sort((a, b) => a - b);
  return result.length > 0 ? result : Array.from({ length: maxPages }, (_, i) => i + 1);
}

export const PdfToImageTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [format, setFormat] = useState<'png' | 'jpeg' | 'webp'>('png');
  const [scale, setScale] = useState<number>(2.0);
  const [quality, setQuality] = useState<number>(0.92);
  const [pageMode, setPageMode] = useState<'all' | 'custom'>('all');
  const [customPages, setCustomPages] = useState<string>('');

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('Select a PDF to convert pages to crisp images');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [downloadInfo, setDownloadInfo] = useState<{ url: string; filename: string; size: number } | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) revokeUrl(previewUrl);
      if (downloadInfo?.url) revokeUrl(downloadInfo.url);
    };
  }, [previewUrl, downloadInfo]);

  const handleFileSelected = async (selectedFiles: FileList | File[]) => {
    setErrorMessage(null);
    if (downloadInfo?.url) {
      revokeUrl(downloadInfo.url);
      setDownloadInfo(null);
    }

    const chosen = selectedFiles[0];
    if (!chosen) return;

    const sizeCheck = validateFileSize(chosen, 100);
    if (!sizeCheck.valid) {
      setErrorMessage(sizeCheck.error || 'File too large');
      return;
    }

    const typeCheck = validateFileType(chosen, ['application/pdf'], ['.pdf']);
    if (!typeCheck.valid) {
      setErrorMessage(typeCheck.error || 'Please select a valid PDF file');
      return;
    }

    try {
      setStatus(`Reading "${chosen.name}"...`);
      const pdf = await loadPdfDocument(chosen);
      setFile(chosen);
      setTotalPages(pdf.numPages);
      setStatus(`Loaded "${chosen.name}" (${pdf.numPages} page${pdf.numPages > 1 ? 's' : ''})`);

      try {
        const firstPage = await pdf.getPage(1);
        const previewCanvas = await renderPdfPageToCanvas(firstPage, 1.0);
        const url = previewCanvas.toDataURL('image/jpeg', 0.85);
        if (previewUrl) revokeUrl(previewUrl);
        setPreviewUrl(url);
      } catch (previewErr) {
        console.warn('Page preview skipped:', previewErr);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err?.message || 'Failed to read PDF. Verify the file is not corrupted.');
    }
  };

  const handleConvert = async () => {
    if (!file || isProcessing) return;
    setIsProcessing(true);
    setErrorMessage(null);
    if (downloadInfo?.url) {
      revokeUrl(downloadInfo.url);
      setDownloadInfo(null);
    }
    setStatus('Loading PDF pages into renderer...');
    setProgress(5);

    try {
      const pdf = await loadPdfDocument(file);
      const targetPages = pageMode === 'custom' && customPages.trim()
        ? parsePageRange(customPages, pdf.numPages)
        : Array.from({ length: pdf.numPages }, (_, i) => i + 1);

      if (targetPages.length === 0) {
        throw new Error('No valid pages selected for conversion.');
      }

      const totalTarget = targetPages.length;
      const imagesMap: Record<string, Uint8Array> = {};
      const mime = format === 'png' ? 'image/png' : format === 'webp' ? 'image/webp' : 'image/jpeg';
      const ext = format === 'png' ? 'png' : format === 'webp' ? 'webp' : 'jpg';
      const baseDocName = file.name.replace(/\.pdf$/i, '');

      let singleBlob: Blob | null = null;
      let singleFileName = '';

      for (let idx = 0; idx < totalTarget; idx++) {
        const pageNum = targetPages[idx];
        setStatus(`Rendering page ${pageNum} (${idx + 1} of ${totalTarget}) at ${scale}x scale...`);
        setProgress(Math.round(((idx + 1) / totalTarget) * 88));

        const page = await pdf.getPage(pageNum);
        const canvas = await renderPdfPageToCanvas(page, scale);

        const pageBlob: Blob = await new Promise((resolve, reject) => {
          canvas.toBlob(
            b => (b ? resolve(b) : reject(new Error(`Failed to encode page ${pageNum} to image`))),
            mime,
            quality
          );
        });

        const pageFileName = `${baseDocName}-page-${String(pageNum).padStart(3, '0')}.${ext}`;

        if (totalTarget === 1) {
          singleBlob = pageBlob;
          singleFileName = pageFileName;
        } else {
          const buffer = await pageBlob.arrayBuffer();
          imagesMap[`page-${String(pageNum).padStart(3, '0')}.${ext}`] = new Uint8Array(buffer);
        }

        // Clean canvas bitmap memory
        canvas.width = 0;
        canvas.height = 0;
      }

      setStatus('Packaging image output...');
      setProgress(95);

      let finalBlob: Blob;
      let finalName: string;

      if (totalTarget === 1 && singleBlob) {
        finalBlob = singleBlob;
        finalName = singleFileName;
      } else {
        finalName = `${baseDocName}-images.zip`;
        const zipped = zipSync(imagesMap);
        finalBlob = new Blob([zipped as any], { type: 'application/zip' });
      }

      // Trigger automatic download
      downloadBlob(finalBlob, finalName);

      // Keep clickable re-download URL available
      const url = URL.createObjectURL(finalBlob);
      setDownloadInfo({ url, filename: finalName, size: finalBlob.size });

      setProgress(100);
      setStatus(`Success! Exported ${totalTarget} image${totalTarget > 1 ? 's' : ''} (${formatBytes(finalBlob.size)})`);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err?.message || 'Failed to convert PDF pages to images');
      setStatus('Conversion failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClear = () => {
    if (previewUrl) revokeUrl(previewUrl);
    if (downloadInfo?.url) revokeUrl(downloadInfo.url);
    setFile(null);
    setTotalPages(0);
    setPreviewUrl(null);
    setErrorMessage(null);
    setDownloadInfo(null);
    setStatus('Select a PDF to convert pages to crisp images');
    setProgress(0);
  };

  const activePagesCount = pageMode === 'custom' && customPages.trim()
    ? parsePageRange(customPages, totalPages).length
    : totalPages;

  return (
    <ToolLayout
      title="PDF to Image (High Resolution)"
      description="Convert PDF document pages into crisp, high-resolution PNG, JPG, or WebP image files with custom scale and lossless rendering."
      howItWorks="Renders vector PDF coordinates directly onto an HTML5 canvas at high DPI (up to 4.0x scale / 300 DPI) using bundled pdfjs-dist. Transparency is backed with pure white and exported without server transmission."
      faq="All conversions happen 100% inside your browser memory. No pages are sent to any cloud server."
      amberCardContent={
        <>
          <div className="card-topline">
            <span className="card-tag">
              <span className="glyph-badge">
                <Image size={14} />
              </span>
              source pdf
            </span>
            <span className="handwritten-hint">(drop pdf or browse)</span>
          </div>

          <Dropzone
            accept="application/pdf"
            multiple={false}
            onFilesSelected={handleFileSelected}
            title={file ? file.name : 'Select PDF or drop here'}
            subtitle={file ? `${totalPages} page${totalPages > 1 ? 's' : ''} · ${formatBytes(file.size)}` : 'Single PDF up to 100MB'}
          />

          {file && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                {file.name} ({totalPages} pages)
              </span>
              <button
                type="button"
                onClick={handleClear}
                className="btn-secondary-compact"
                style={{ color: '#ef4444' }}
              >
                clear
              </button>
            </div>
          )}

          {previewUrl && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
              <span style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                preview: page 1 of {totalPages}
              </span>
              <div style={{ maxHeight: '180px', overflow: 'hidden', borderRadius: '8px', border: '1px dotted var(--border-dashed)', display: 'flex', justifyContent: 'center', background: 'var(--surface-well)' }}>
                <img src={previewUrl} alt="Page 1 preview" style={{ maxHeight: '180px', objectFit: 'contain' }} />
              </div>
            </div>
          )}
        </>
      }
      indigoCardContent={
        <>
          <div className="card-topline">
            <span className="card-tag">
              <span className="glyph-badge">
                <Sliders size={14} />
              </span>
              image options
            </span>
            <span className="handwritten-hint">(format, scale &amp; pages)</span>
          </div>

          <div className="control-grid">
            <div className="control-field">
              <label className="control-label">image format</label>
              <select className="craft-select" value={format} onChange={e => setFormat(e.target.value as any)}>
                <option value="png">PNG (Lossless &amp; Sharp)</option>
                <option value="jpeg">JPEG (Compressed)</option>
                <option value="webp">WebP (Modern Compact)</option>
              </select>
            </div>

            <div className="control-field">
              <label className="control-label">render scale / resolution</label>
              <select className="craft-select" value={scale} onChange={e => setScale(Number(e.target.value))}>
                <option value="1.5">1.5x (Fast · 108 DPI)</option>
                <option value="2.0">2.0x (Crisp High-Res · 144 DPI) · Recommended</option>
                <option value="3.0">3.0x (Ultra HD · 216 DPI)</option>
                <option value="4.167">4.0x (Print Quality · 300 DPI)</option>
              </select>
            </div>

            <div className="control-field">
              <label className="control-label">page selection</label>
              <select className="craft-select" value={pageMode} onChange={e => setPageMode(e.target.value as any)}>
                <option value="all">All Pages ({totalPages || 0})</option>
                <option value="custom">Custom Page Range</option>
              </select>
            </div>

            {pageMode === 'custom' && (
              <div className="control-field">
                <label className="control-label">page range (e.g. 1-3, 5)</label>
                <input
                  type="text"
                  className="craft-input"
                  placeholder="e.g. 1-3, 5"
                  value={customPages}
                  onChange={e => setCustomPages(e.target.value)}
                />
              </div>
            )}

            {(format === 'jpeg' || format === 'webp') && (
              <div className="control-field" style={{ gridColumn: pageMode === 'custom' ? undefined : '1 / -1' }}>
                <label className="control-label">{format.toUpperCase()} quality</label>
                <select className="craft-select" value={quality} onChange={e => setQuality(Number(e.target.value))}>
                  <option value="0.95">Very High (0.95)</option>
                  <option value="0.88">High (0.88)</option>
                  <option value="0.75">Balanced (0.75)</option>
                </select>
              </div>
            )}
          </div>
        </>
      }
      greenCardContent={
        <>
          <div className="card-topline">
            <span className="card-tag">
              <span className="glyph-badge">
                <Play size={14} />
              </span>
              output &amp; status
            </span>
            <span className="handwritten-hint">(high-dpi download)</span>
          </div>

          <div className="stats-row">
            <div className="stat-item">
              <span className="stat-label">file</span>
              <span className="stat-value">{file ? '1 PDF' : 'None'}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">pages</span>
              <span className="stat-value">{file ? `${activePagesCount} of ${totalPages}` : 0}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">format</span>
              <span className="stat-value">{format.toUpperCase()}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">resolution</span>
              <span className="stat-value">{scale}x ({Math.round(scale * 72)} DPI)</span>
            </div>
          </div>

          <div className={`status-box ${errorMessage ? 'error' : isProcessing ? 'active-progress' : downloadInfo ? 'success' : ''}`}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="pulse-dot" style={{ backgroundColor: errorMessage ? '#ef4444' : downloadInfo ? '#10b981' : undefined }}></span>
              <span>{errorMessage || status}</span>
            </div>
            {isProcessing && <span>{progress}%</span>}
          </div>

          <button
            type="button"
            onClick={handleConvert}
            disabled={!file || isProcessing || activePagesCount === 0}
            className="btn-primary-mint"
            style={{ width: '100%', marginTop: '6px' }}
          >
            <FileDown size={15} />
            <span>Convert to {format.toUpperCase()} ({activePagesCount > 1 ? `${activePagesCount} images in ZIP` : '1 image'})</span>
            <span>→</span>
          </button>

          {downloadInfo && (
            <a
              href={downloadInfo.url}
              download={downloadInfo.filename}
              className="btn-secondary"
              style={{
                width: '100%',
                marginTop: '8px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                textDecoration: 'none',
                fontFamily: 'var(--font-mono)',
                fontSize: '12px'
              }}
            >
              <CheckCircle2 size={14} style={{ color: '#10b981' }} />
              <span>download again ({downloadInfo.filename})</span>
              <span>↳</span>
            </a>
          )}
        </>
      }
    />
  );
};
