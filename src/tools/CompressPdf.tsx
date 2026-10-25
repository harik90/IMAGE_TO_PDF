import React, { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import { ToolLayout } from '../components/ToolLayout';
import { Dropzone } from '../components/Dropzone';
import { formatBytes, validateFileSize, validateFileType, downloadBlob } from '../utils/file';
import { loadPdfDocument, renderPdfPageToCanvas } from '../utils/pdf';

export const CompressPdfTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [quality, setQuality] = useState<number>(0.7);
  const [scale, setScale] = useState<number>(1.5);
  const [outputFileName, setOutputFileName] = useState<string>('compressed.pdf');

  const [compressedBlob, setCompressedBlob] = useState<Blob | null>(null);
  const [status, setStatus] = useState<string>('Select a PDF to compress');
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
      setCompressedBlob(null);
      setOutputFileName(chosen.name.replace(/\.pdf$/i, '') + '-compressed.pdf');
      setStatus(`Loaded "${chosen.name}" (${pdf.numPages} pages, ${formatBytes(chosen.size)})`);
    } catch {
      setErrorMessage('This PDF is locked or damaged. Remove the password and try again.');
    }
  };

  const handleCompress = async () => {
    if (!file || isProcessing) return;
    setIsProcessing(true);
    setErrorMessage(null);
    setStatus('Loading PDF pages for canvas recompression...');
    setProgress(5);

    try {
      const pdf = await loadPdfDocument(file);
      const outDoc = await PDFDocument.create();
      const count = pdf.numPages;

      for (let i = 1; i <= count; i++) {
        setStatus(`Recompressing page ${i} of ${count}...`);
        setProgress(Math.round((i / count) * 85));

        const page = await pdf.getPage(i);
        const canvas = await renderPdfPageToCanvas(page, scale);

        const jpegDataUrl = canvas.toDataURL('image/jpeg', quality);
        const res = await fetch(jpegDataUrl);
        const jpegBytes = await res.arrayBuffer();
        const embedded = await outDoc.embedJpg(jpegBytes);

        const viewport = page.getViewport({ scale: 1.0 });
        const newPage = outDoc.addPage([viewport.width, viewport.height]);

        newPage.drawImage(embedded, {
          x: 0,
          y: 0,
          width: viewport.width,
          height: viewport.height
        });

        canvas.width = 0;
        canvas.height = 0;
      }

      setStatus('Finalizing compressed PDF...');
      setProgress(95);

      const outBytes = await outDoc.save();
      const blob = new Blob([outBytes as any], { type: 'application/pdf' });
      setCompressedBlob(blob);

      const diff = file.size - blob.size;
      const pct = Math.round((diff / file.size) * 100);

      downloadBlob(blob, outputFileName || 'compressed.pdf');
      setStatus(`Compression complete! ${formatBytes(file.size)} → ${formatBytes(blob.size)} (${pct >= 0 ? `${pct}% reduction` : 'rasterized'})`);
      setProgress(100);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'PDF compression failed');
      setStatus('Compression failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ToolLayout
      title="Compress PDF"
      description="Reduce PDF file size by re-compressing high-resolution embedded images and rasterizing pages."
      howItWorks="Renders each page to canvas at your chosen pixel ratio and re-encodes graphic content with optimized JPEG compression parameters via pdf-lib. Honestly displays original vs compressed size."
      faq="All processing runs entirely on your device in browser memory. Never uploaded anywhere."
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
            title={file ? file.name : 'Select PDF to compress'}
            subtitle={file ? `${totalPages} pages · ${formatBytes(file.size)}` : 'Single PDF document up to 50MB'}
          />
        </>
      }
      indigoCardContent={
        <>
          <div className="card-topline">
            <span className="card-tag">
              <span className="glyph-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
              </span>
              compression target
            </span>
            <span className="handwritten-hint">(quality &amp; dpi)</span>
          </div>

          <div className="control-grid">
            <div className="control-field">
              <label className="control-label">render scale / dpi</label>
              <select className="craft-select" value={scale} onChange={e => setScale(Number(e.target.value))}>
                <option value="1.0">1.0x (Web - 72 DPI, Smallest)</option>
                <option value="1.5">1.5x (Balanced - 108 DPI)</option>
                <option value="2.0">2.0x (Print - 144 DPI)</option>
              </select>
            </div>

            <div className="control-field">
              <label className="control-label">jpeg quality</label>
              <select className="craft-select" value={quality} onChange={e => setQuality(Number(e.target.value))}>
                <option value="0.50">Aggressive (0.50)</option>
                <option value="0.70">Balanced (0.70)</option>
                <option value="0.85">High (0.85)</option>
              </select>
            </div>
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
            <span className="handwritten-hint">(size comparison)</span>
          </div>

          <div className="stats-row">
            <div className="stat-item">
              <span className="stat-label">original</span>
              <span className="stat-value">{file ? formatBytes(file.size) : '0 B'}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">compressed</span>
              <span className="stat-value">{compressedBlob ? formatBytes(compressedBlob.size) : '—'}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">saved</span>
              <span className="stat-value" style={{ color: 'var(--mint-primary)' }}>
                {file && compressedBlob
                  ? `${Math.max(0, Math.round(((file.size - compressedBlob.size) / file.size) * 100))}%`
                  : '—'}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">pages</span>
              <span className="stat-value">{totalPages}</span>
            </div>
          </div>

          <div className={`status-box ${errorMessage ? 'error' : isProcessing ? 'active-progress' : ''}`}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="pulse-dot" style={{ backgroundColor: errorMessage ? '#ef4444' : undefined }}></span>
              <span>{errorMessage || status}</span>
            </div>
            {isProcessing && <span>{progress}%</span>}
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <input
                type="text"
                className="craft-input"
                value={outputFileName}
                onChange={e => setOutputFileName(e.target.value)}
                placeholder="compressed.pdf"
              />
            </div>
            <button
              onClick={handleCompress}
              disabled={!file || isProcessing}
              className="btn-primary-mint"
            >
              <span>compress pdf</span>
              <span>→</span>
            </button>
          </div>
        </>
      }
    />
  );
};
