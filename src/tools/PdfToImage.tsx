import React, { useState } from 'react';
import { ToolLayout } from '../components/ToolLayout';
import { Dropzone } from '../components/Dropzone';
import { formatBytes, validateFileSize, validateFileType, downloadBlob, downloadZip } from '../utils/file';
import { loadPdfDocument, renderPdfPageToCanvas } from '../utils/pdf';

export const PdfToImageTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [format, setFormat] = useState<'png' | 'jpeg'>('png');
  const [scale, setScale] = useState<number>(2.0);
  const [quality, setQuality] = useState<number>(0.9);

  const [status, setStatus] = useState<string>('Select a PDF to convert pages to images');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileSelected = async (selectedFiles: FileList | File[]) => {
    setErrorMessage(null);
    const chosen = selectedFiles[0];
    if (!chosen) return;

    const sizeCheck = validateFileSize(chosen, 50);
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
      const pdf = await loadPdfDocument(chosen);
      setFile(chosen);
      setTotalPages(pdf.numPages);
      setStatus(`Loaded "${chosen.name}" (${pdf.numPages} pages)`);
    } catch {
      setErrorMessage('This PDF is locked or damaged. Remove the password and try again.');
    }
  };

  const handleConvert = async () => {
    if (!file || isProcessing) return;
    setIsProcessing(true);
    setErrorMessage(null);
    setStatus('Loading PDF pages into renderer...');
    setProgress(5);

    try {
      const pdf = await loadPdfDocument(file);
      const count = pdf.numPages;
      const imagesMap: Record<string, Uint8Array> = {};

      for (let i = 1; i <= count; i++) {
        setStatus(`Rendering page ${i} of ${count} at ${scale}x scale...`);
        setProgress(Math.round((i / count) * 85));

        const page = await pdf.getPage(i);
        const canvas = await renderPdfPageToCanvas(page, scale);

        const mime = format === 'png' ? 'image/png' : 'image/jpeg';
        const dataUrl = canvas.toDataURL(mime, quality);
        const res = await fetch(dataUrl);
        const buffer = await res.arrayBuffer();
        const ext = format === 'png' ? 'png' : 'jpg';
        const pageFileName = `page-${String(i).padStart(3, '0')}.${ext}`;

        imagesMap[pageFileName] = new Uint8Array(buffer);

        // Memory cleanup
        canvas.width = 0;
        canvas.height = 0;
      }

      setStatus('Packaging images...');
      setProgress(95);

      if (count === 1) {
        // Single page direct download
        const singleKey = Object.keys(imagesMap)[0];
        const blob = new Blob([imagesMap[singleKey] as any], { type: format === 'png' ? 'image/png' : 'image/jpeg' });
        downloadBlob(blob, `${file.name.replace(/\.pdf$/i, '')}-${singleKey}`);
        setStatus(`Downloaded 1 page image (${formatBytes(blob.size)})`);
      } else {
        // Zip archive for multi-page
        const zipName = `${file.name.replace(/\.pdf$/i, '')}-images.zip`;
        await downloadZip(imagesMap, zipName);
        setStatus(`Success! Downloaded ${count} page images in ${zipName}`);
      }
      setProgress(100);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to convert PDF pages to images');
      setStatus('Conversion failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ToolLayout
      title="PDF to Image (PNG / JPG)"
      description="Render each page of a PDF into high-definition standalone PNG or JPEG images."
      howItWorks="Renders vector and raster PDF elements directly to an HTML5 canvas at your chosen pixel ratio (1x, 2x, 3x) via pdfjs-dist, then compiles all page images into a single zip file with fflate."
      faq="All processing runs entirely on your browser GPU/CPU. No server is used."
      amberCardContent={
        <>
          <div className="card-topline">
            <span className="card-tag">
              <span className="glyph-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
              </span>
              source pdf
            </span>
            <span className="handwritten-hint">(drop file or browse)</span>
          </div>

          <Dropzone
            accept="application/pdf"
            multiple={false}
            onFilesSelected={handleFileSelected}
            title={file ? file.name : 'Select PDF to convert'}
            subtitle={file ? `${totalPages} pages · ${formatBytes(file.size)}` : 'Single PDF document up to 50MB'}
          />

          {file && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                {totalPages} pages ready
              </span>
              <button
                onClick={() => { setFile(null); setTotalPages(0); }}
                className="btn-secondary"
                style={{ color: '#ef4444' }}
              >
                clear
              </button>
            </div>
          )}
        </>
      }
      indigoCardContent={
        <>
          <div className="card-topline">
            <span className="card-tag">
              <span className="glyph-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
              </span>
              image options
            </span>
            <span className="handwritten-hint">(format &amp; scale)</span>
          </div>

          <div className="control-grid">
            <div className="control-field">
              <label className="control-label">image format</label>
              <select className="craft-select" value={format} onChange={e => setFormat(e.target.value as any)}>
                <option value="png">PNG (Lossless)</option>
                <option value="jpeg">JPEG (Compressed)</option>
              </select>
            </div>

            <div className="control-field">
              <label className="control-label">render scale / dpi</label>
              <select className="craft-select" value={scale} onChange={e => setScale(Number(e.target.value))}>
                <option value="1.0">1.0x (Standard - 72 DPI)</option>
                <option value="2.0">2.0x (High Res - 144 DPI)</option>
                <option value="3.0">3.0x (Ultra HD - 216 DPI)</option>
              </select>
            </div>

            {format === 'jpeg' && (
              <div className="control-field" style={{ gridColumn: '1 / -1' }}>
                <label className="control-label">jpeg quality</label>
                <select className="craft-select" value={quality} onChange={e => setQuality(Number(e.target.value))}>
                  <option value="0.95">Very High (0.95)</option>
                  <option value="0.85">High (0.85)</option>
                  <option value="0.70">Medium (0.70)</option>
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
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </span>
              output &amp; stats
            </span>
            <span className="handwritten-hint">(archive ready)</span>
          </div>

          <div className="stats-row">
            <div className="stat-item">
              <span className="stat-label">file</span>
              <span className="stat-value">{file ? '1 PDF' : 'None'}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">pages</span>
              <span className="stat-value">{totalPages}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">format</span>
              <span className="stat-value">{format.toUpperCase()} · {scale}x</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">archive</span>
              <span className="stat-value">{totalPages > 1 ? 'ZIP' : format.toUpperCase()}</span>
            </div>
          </div>

          <div className={`status-box ${errorMessage ? 'error' : isProcessing ? 'active-progress' : ''}`}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="pulse-dot" style={{ backgroundColor: errorMessage ? '#ef4444' : undefined }}></span>
              <span>{errorMessage || status}</span>
            </div>
            {isProcessing && <span>{progress}%</span>}
          </div>

          <button
            onClick={handleConvert}
            disabled={!file || isProcessing}
            className="btn-primary-mint"
          >
            <span>convert {totalPages} page{totalPages !== 1 ? 's' : ''} to {format.toUpperCase()}</span>
            <span>→</span>
          </button>
        </>
      }
    />
  );
};
