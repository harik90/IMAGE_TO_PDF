import React, { useState } from 'react';
import { PDFDocument, rgb } from 'pdf-lib';
import { ToolLayout } from '../components/ToolLayout';
import { Dropzone } from '../components/Dropzone';
import { formatBytes, validateFileSize, validateFileType, downloadBlob } from '../utils/file';
import { QueuedFile } from '../types';

export const ImageToPdfTool: React.FC = () => {
  const [files, setFiles] = useState<QueuedFile[]>([]);
  const [pageSize, setPageSize] = useState<'a4' | 'letter' | 'legal' | 'fit'>('a4');
  const [orientation, setOrientation] = useState<'auto' | 'portrait' | 'landscape'>('auto');
  const [margin, setMargin] = useState<number>(10);
  const [quality, setQuality] = useState<number>(0.85);
  const [authorName, setAuthorName] = useState<string>('');
  const [addPageNumbers, setAddPageNumbers] = useState<boolean>(false);
  const [outputFileName, setOutputFileName] = useState<string>(`images-${new Date().toISOString().slice(0, 10)}.pdf`);

  const [status, setStatus] = useState<string>('Ready to compile');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFilesSelected = (newFiles: FileList | File[]) => {
    setErrorMessage(null);
    const valid: QueuedFile[] = [];

    Array.from(newFiles).forEach(file => {
      const sizeCheck = validateFileSize(file, 50);
      if (!sizeCheck.valid) {
        setErrorMessage(sizeCheck.error || 'File too large');
        return;
      }
      const typeCheck = validateFileType(
        file,
        ['image/*'],
        ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', '.bmp']
      );
      if (!typeCheck.valid) {
        setErrorMessage(typeCheck.error || 'Unsupported file type');
        return;
      }

      valid.push({
        id: 'img_' + Math.random().toString(36).substring(2, 9),
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        previewUrl: URL.createObjectURL(file),
        rotation: 0
      });
    });

    setFiles(prev => [...prev, ...valid]);
  };

  const handleClear = () => {
    files.forEach(f => {
      if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
    });
    setFiles([]);
    setErrorMessage(null);
    setStatus('Queue cleared');
    setProgress(0);
  };

  const handleRotate = (index: number) => {
    setFiles(prev => {
      const next = [...prev];
      next[index] = { ...next[index], rotation: ((next[index].rotation || 0) + 90) % 360 };
      return next;
    });
  };

  const handleRemove = (index: number) => {
    setFiles(prev => {
      const next = [...prev];
      if (next[index].previewUrl) URL.revokeObjectURL(next[index].previewUrl!);
      next.splice(index, 1);
      return next;
    });
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    setFiles(prev => {
      const next = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= next.length) return prev;
      const tmp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = tmp;
      return next;
    });
  };

  const PAGE_DIMENSIONS_PT: Record<string, [number, number]> = {
    a4: [595.28, 841.89],
    letter: [612, 792],
    legal: [612, 1008]
  };

  const handleCompilePdf = async () => {
    if (files.length === 0 || isProcessing) return;
    setIsProcessing(true);
    setErrorMessage(null);
    setStatus('Initializing PDF compiler...');
    setProgress(5);

    try {
      const pdfDoc = await PDFDocument.create();
      if (authorName.trim()) {
        pdfDoc.setAuthor(authorName.trim());
        pdfDoc.setCreator('image_to_pdf / client-side');
      }

      for (let i = 0; i < files.length; i++) {
        const item = files[i];
        setStatus(`Processing page ${i + 1} of ${files.length} (${item.name})...`);
        setProgress(Math.round(((i + 1) / files.length) * 90));

        // Render image onto offscreen canvas to handle rotation, transparent PNG background, and compression
        const img = new Image();
        img.src = item.previewUrl!;
        await new Promise((res, rej) => {
          img.onload = res;
          img.onerror = () => rej(new Error(`Failed to decode image "${item.name}"`));
        });

        const isRotated = (item.rotation || 0) === 90 || (item.rotation || 0) === 270;
        const targetW = isRotated ? img.naturalHeight : img.naturalWidth;
        const targetH = isRotated ? img.naturalWidth : img.naturalHeight;

        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Could not create canvas context');

        // Fill white background for transparent PNGs/SVGs
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, targetW, targetH);

        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(((item.rotation || 0) * Math.PI) / 180);
        const drawW = isRotated ? targetH : targetW;
        const drawH = isRotated ? targetW : targetH;
        ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
        ctx.restore();

        // Convert to high efficiency JPEG blob
        const jpegDataUrl = canvas.toDataURL('image/jpeg', quality);
        const jpegBytes = await fetch(jpegDataUrl).then(r => r.arrayBuffer());
        const embeddedImage = await pdfDoc.embedJpg(jpegBytes);

        // Determine Page Size & Orientation in Points (72 pt = 1 inch)
        let pageW = targetW;
        let pageH = targetH;

        if (pageSize !== 'fit') {
          const dims = PAGE_DIMENSIONS_PT[pageSize] || PAGE_DIMENSIONS_PT.a4;
          const isLandscape = orientation === 'landscape' || (orientation === 'auto' && targetW > targetH);
          pageW = isLandscape ? Math.max(dims[0], dims[1]) : Math.min(dims[0], dims[1]);
          pageH = isLandscape ? Math.min(dims[0], dims[1]) : Math.max(dims[0], dims[1]);
        }

        const page = pdfDoc.addPage([pageW, pageH]);
        const marginPt = (margin / 25.4) * 72; // mm to points

        const availW = Math.max(20, pageW - marginPt * 2);
        const availH = Math.max(20, pageH - marginPt * 2);

        const imgRatio = targetW / targetH;
        const availRatio = availW / availH;

        let finalW = availW;
        let finalH = availH;
        if (imgRatio > availRatio) {
          finalH = availW / imgRatio;
        } else {
          finalW = availH * imgRatio;
        }

        const posX = (pageW - finalW) / 2;
        const posY = (pageH - finalH) / 2;

        page.drawImage(embeddedImage, {
          x: posX,
          y: posY,
          width: finalW,
          height: finalH
        });

        if (addPageNumbers && pageSize !== 'fit') {
          page.drawText(`${i + 1} / ${files.length}`, {
            x: pageW / 2 - 15,
            y: Math.max(8, marginPt / 2),
            size: 9,
            color: rgb(0.5, 0.5, 0.5)
          });
        }
      }

      setStatus('Finalizing PDF document...');
      setProgress(98);
      const pdfBytes = await pdfDoc.save();
      const pdfBlob = new Blob([pdfBytes as any], { type: 'application/pdf' });

      let filename = outputFileName.trim() || 'images-to-pdf.pdf';
      if (!filename.toLowerCase().endsWith('.pdf')) filename += '.pdf';

      downloadBlob(pdfBlob, filename);
      setStatus(`Success! Compiled ${files.length} pages (${formatBytes(pdfBlob.size)})`);
      setProgress(100);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'An error occurred during PDF compilation.');
      setStatus('Compilation failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const totalBytes = files.reduce((acc, f) => acc + f.size, 0);

  return (
    <ToolLayout
      title="Image to PDF"
      description="Compile multiple images into a clean, custom-formatted PDF document completely inside your browser."
      howItWorks="Images are loaded and scaled onto a high-resolution offscreen canvas with white background filling for transparent PNGs, then encoded and compiled into a compliant PDF using pdf-lib. No external server receives your data."
      faq="All processing runs strictly in your device's memory. Memory is released immediately after PDF generation."
      amberCardContent={
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
              import images
            </span>
            <span className="handwritten-hint">(drop files or browse)</span>
          </div>

          <Dropzone
            accept="image/*"
            onFilesSelected={handleFilesSelected}
            title="Select images or drop anywhere"
            subtitle="JPG · PNG · WEBP · GIF · SVG · BMP"
          />

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
            <button
              onClick={() => setFiles(prev => [...prev].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true })))}
              disabled={files.length === 0}
              className="btn-secondary"
            >
              sort by name
            </button>
            <button
              onClick={() => setFiles(prev => [...prev].reverse())}
              disabled={files.length === 0}
              className="btn-secondary"
            >
              reverse
            </button>
            <button
              onClick={() => setFiles(prev => prev.map(f => ({ ...f, rotation: ((f.rotation || 0) + 90) % 360 })))}
              disabled={files.length === 0}
              className="btn-secondary"
            >
              rotate all 90°
            </button>
            <button
              onClick={handleClear}
              disabled={files.length === 0}
              className="btn-secondary"
              style={{ color: '#ef4444' }}
            >
              clear queue
            </button>
          </div>
        </>
      }
      indigoCardContent={
        <>
          <div className="card-topline">
            <span className="card-tag">
              <span className="glyph-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
              </span>
              pdf specifications
            </span>
            <span className="handwritten-hint">(layout &amp; margins)</span>
          </div>

          <div className="control-grid">
            <div className="control-field">
              <label className="control-label">page size</label>
              <select className="craft-select" value={pageSize} onChange={e => setPageSize(e.target.value as any)}>
                <option value="a4">A4 (210 × 297 mm)</option>
                <option value="letter">Letter (8.5 × 11 in)</option>
                <option value="legal">Legal (8.5 × 14 in)</option>
                <option value="fit">Fit to Image (No Borders)</option>
              </select>
            </div>

            <div className="control-field">
              <label className="control-label">orientation</label>
              <select className="craft-select" value={orientation} onChange={e => setOrientation(e.target.value as any)}>
                <option value="auto">Auto (per image)</option>
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
              </select>
            </div>

            <div className="control-field">
              <label className="control-label">margin</label>
              <select className="craft-select" value={margin} onChange={e => setMargin(Number(e.target.value))}>
                <option value="0">None (0 mm)</option>
                <option value="5">Small (5 mm)</option>
                <option value="10">Standard (10 mm)</option>
                <option value="20">Large (20 mm)</option>
              </select>
            </div>

            <div className="control-field">
              <label className="control-label">image quality</label>
              <select className="craft-select" value={quality} onChange={e => setQuality(Number(e.target.value))}>
                <option value="0.95">High (0.95)</option>
                <option value="0.85">Balanced (0.85)</option>
                <option value="0.70">Compact (0.70)</option>
                <option value="0.50">Maximum Compression</option>
              </select>
            </div>

            <div className="control-field" style={{ gridColumn: '1 / -1' }}>
              <label className="control-label">pdf author</label>
              <input
                type="text"
                className="craft-input"
                placeholder="Your name"
                value={authorName}
                onChange={e => setAuthorName(e.target.value)}
              />
            </div>

            <label style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '11px' }}>
              <input
                type="checkbox"
                checked={addPageNumbers}
                onChange={e => setAddPageNumbers(e.target.checked)}
                style={{ accentColor: 'var(--mint-primary)' }}
              />
              <span>Add page numbers in footer (e.g. Page 1 of 5)</span>
            </label>
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
            <span className="handwritten-hint">(live state)</span>
          </div>

          <div className="stats-row">
            <div className="stat-item">
              <span className="stat-label">files</span>
              <span className="stat-value">{files.length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">payload</span>
              <span className="stat-value">{formatBytes(totalBytes)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">tool</span>
              <span className="stat-value">image-to-pdf</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">target</span>
              <span className="stat-value" title={outputFileName}>{outputFileName}</span>
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
                placeholder="output.pdf"
              />
            </div>
            <button
              onClick={handleCompilePdf}
              disabled={files.length === 0 || isProcessing}
              className="btn-primary-mint"
            >
              <span>compile to pdf</span>
              <span>→</span>
            </button>
          </div>
        </>
      }
      fileSequenceContent={
        files.length > 0 ? (
          <div className="queue-box">
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Page Sequence ({files.length} images)
            </div>
            {files.map((item, index) => (
              <div key={item.id} className="queue-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', width: '24px' }}>
                    {String(index + 1).padStart(2, '0')}.
                  </span>
                  <img
                    src={item.previewUrl}
                    alt={item.name}
                    className="queue-thumb"
                    style={{ transform: `rotate(${item.rotation || 0}deg)` }}
                  />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.name}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      ↳ {formatBytes(item.size)} · {item.rotation || 0}° rotation
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                  <button
                    onClick={() => handleMove(index, 'up')}
                    disabled={index === 0}
                    className="btn-secondary"
                    style={{ padding: '6px 8px' }}
                    title="Move up"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => handleMove(index, 'down')}
                    disabled={index === files.length - 1}
                    className="btn-secondary"
                    style={{ padding: '6px 8px' }}
                    title="Move down"
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => handleRotate(index)}
                    className="btn-secondary"
                    style={{ padding: '6px 8px' }}
                    title="Rotate 90°"
                  >
                    ↻
                  </button>
                  <button
                    onClick={() => handleRemove(index)}
                    className="btn-secondary"
                    style={{ padding: '6px 8px', color: '#ef4444' }}
                    title="Remove"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : undefined
      }
    />
  );
};
