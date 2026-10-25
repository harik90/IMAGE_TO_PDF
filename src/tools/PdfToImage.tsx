import React, { useState } from 'react';
import { ToolLayout } from '../components/ToolLayout';
import { Dropzone } from '../components/Dropzone';
import { formatBytes, validateFileSize, validateFileType, downloadBlob, downloadZip } from '../utils/file';
import { loadPdfDocument, renderPdfPageToCanvas } from '../utils/pdf';
import { Image, Sliders, Play, FileDown } from 'lucide-react';

export const PdfToImageTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [format, setFormat] = useState<'png' | 'jpeg'>('png');
  const [scale, setScale] = useState<number>(2.0);
  const [quality, setQuality] = useState<number>(0.92);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [status, setStatus] = useState<string>('Select a PDF to convert pages to crisp images');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileSelected = async (selectedFiles: FileList | File[]) => {
    setErrorMessage(null);
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
      setStatus(`Loading "${chosen.name}"...`);
      const pdf = await loadPdfDocument(chosen);
      setFile(chosen);
      setTotalPages(pdf.numPages);
      setStatus(`Loaded "${chosen.name}" (${pdf.numPages} pages)`);

      // Generate sharp page 1 preview
      const firstPage = await pdf.getPage(1);
      const previewCanvas = await renderPdfPageToCanvas(firstPage, 1.5);
      setPreviewUrl(previewCanvas.toDataURL('image/jpeg', 0.88));
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
        setStatus(`Rendering page ${i} of ${count} at ${scale}x scale (high-res)...`);
        setProgress(Math.round((i / count) * 85));

        const page = await pdf.getPage(i);
        const canvas = await renderPdfPageToCanvas(page, scale);

        const mime = format === 'png' ? 'image/png' : 'image/jpeg';
        const pageBlob: Blob = await new Promise((resolve, reject) => {
          canvas.toBlob(
            b => (b ? resolve(b) : reject(new Error('Failed to encode page canvas to image blob'))),
            mime,
            quality
          );
        });
        const buffer = await pageBlob.arrayBuffer();
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
        setStatus(`Downloaded 1 high-resolution page image (${formatBytes(blob.size)})`);
      } else {
        // Zip archive for multi-page
        const zipName = `${file.name.replace(/\.pdf$/i, '')}-images.zip`;
        await downloadZip(imagesMap, zipName);
        setStatus(`Success! Downloaded ${count} high-resolution page images in ${zipName}`);
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

  const handleClear = () => {
    setFile(null);
    setTotalPages(0);
    setPreviewUrl(null);
    setErrorMessage(null);
    setStatus('Select a PDF to convert pages to crisp images');
    setProgress(0);
  };

  return (
    <ToolLayout
      title="PDF to Image (High Resolution)"
      description="Convert PDF document pages into crisp, high-resolution PNG or JPG image files with custom scale and lossless rendering."
      howItWorks="Renders vector PDF coordinates directly onto an HTML5 canvas at high DPI (up to 4.0x scale / 300 DPI) using pdfjs-dist. Transparency is backed with pure white and exported as PNG or high-quality JPEG."
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
            subtitle={file ? `${totalPages} pages · ${formatBytes(file.size)}` : 'Single PDF up to 100MB'}
          />

          {file && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
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
            <span className="handwritten-hint">(format &amp; scale)</span>
          </div>

          <div className="control-grid">
            <div className="control-field">
              <label className="control-label">image format</label>
              <select className="craft-select" value={format} onChange={e => setFormat(e.target.value as any)}>
                <option value="png">PNG (Lossless &amp; Sharp)</option>
                <option value="jpeg">JPEG (Compressed)</option>
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

            {format === 'jpeg' && (
              <div className="control-field" style={{ gridColumn: '1 / -1' }}>
                <label className="control-label">jpeg quality</label>
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
              <span className="stat-value">{totalPages}</span>
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

          <div className={`status-box ${errorMessage ? 'error' : isProcessing ? 'active-progress' : ''}`}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="pulse-dot" style={{ backgroundColor: errorMessage ? '#ef4444' : undefined }}></span>
              <span>{errorMessage || status}</span>
            </div>
            {isProcessing && <span>{progress}%</span>}
          </div>

          <button
            type="button"
            onClick={handleConvert}
            disabled={!file || isProcessing}
            className="btn-primary-mint"
            style={{ width: '100%', marginTop: '6px' }}
          >
            <FileDown size={15} />
            <span>Convert to {format.toUpperCase()} ({totalPages > 1 ? `${totalPages} images in ZIP` : '1 image'})</span>
            <span>→</span>
          </button>
        </>
      }
    />
  );
};
