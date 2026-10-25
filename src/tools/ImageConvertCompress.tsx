import React, { useState } from 'react';
import { ToolLayout } from '../components/ToolLayout';
import { Dropzone } from '../components/Dropzone';
import { formatBytes, validateFileSize, validateFileType, downloadBlob, downloadZip } from '../utils/file';
import { QueuedFile } from '../types';

interface ProcessedImage {
  name: string;
  originalSize: number;
  newSize: number;
  blob: Blob;
  previewUrl: string;
}

export const ImageConvertCompressTool: React.FC = () => {
  const [files, setFiles] = useState<QueuedFile[]>([]);
  const [targetFormat, setTargetFormat] = useState<'image/jpeg' | 'image/png' | 'image/webp'>('image/webp');
  const [quality, setQuality] = useState<number>(0.8);
  const [maxWidth, setMaxWidth] = useState<number>(1920);
  const [resizeEnabled, setResizeEnabled] = useState<boolean>(false);

  const [processed, setProcessed] = useState<ProcessedImage[]>([]);
  const [status, setStatus] = useState<string>('Select images to compress or convert');
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
        ['.png', '.jpg', '.jpeg', '.webp', '.bmp', '.gif']
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
        previewUrl: URL.createObjectURL(file)
      });
    });

    setFiles(prev => [...prev, ...valid]);
    setProcessed([]);
    setStatus(`${valid.length} image(s) queued for conversion & compression`);
  };

  const handleClear = () => {
    files.forEach(f => {
      if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
    });
    processed.forEach(p => {
      URL.revokeObjectURL(p.previewUrl);
    });
    setFiles([]);
    setProcessed([]);
    setErrorMessage(null);
    setStatus('Queue cleared');
    setProgress(0);
  };

  const handleProcess = async () => {
    if (files.length === 0 || isProcessing) return;
    setIsProcessing(true);
    setErrorMessage(null);
    setStatus('Processing images with Canvas API...');
    setProgress(5);

    const results: ProcessedImage[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const item = files[i];
        setStatus(`Processing "${item.name}" (${i + 1} of ${files.length})...`);
        setProgress(Math.round(((i + 1) / files.length) * 90));

        const img = new Image();
        img.src = item.previewUrl!;
        await new Promise((res, rej) => {
          img.onload = res;
          img.onerror = () => rej(new Error(`Failed to decode "${item.name}"`));
        });

        let w = img.naturalWidth;
        let h = img.naturalHeight;

        if (resizeEnabled && maxWidth > 0 && w > maxWidth) {
          h = Math.round((h * maxWidth) / w);
          w = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Could not get canvas context');

        // Fill background white if converting PNG/transparent to JPEG
        if (targetFormat === 'image/jpeg') {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, w, h);
        }

        ctx.drawImage(img, 0, 0, w, h);

        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob(
            b => (b ? resolve(b) : reject(new Error('Canvas blob generation failed'))),
            targetFormat,
            quality
          );
        });

        const ext = targetFormat === 'image/jpeg' ? 'jpg' : targetFormat === 'image/webp' ? 'webp' : 'png';
        const baseName = item.name.substring(0, item.name.lastIndexOf('.')) || item.name;
        const newName = `${baseName}.${ext}`;

        results.push({
          name: newName,
          originalSize: item.size,
          newSize: blob.size,
          blob: blob,
          previewUrl: URL.createObjectURL(blob)
        });

        // Clean canvas
        canvas.width = 0;
        canvas.height = 0;
      }

      setProcessed(results);

      const totalOrig = results.reduce((a, b) => a + b.originalSize, 0);
      const totalNew = results.reduce((a, b) => a + b.newSize, 0);
      const savedPct = totalOrig > 0 ? Math.round(((totalOrig - totalNew) / totalOrig) * 100) : 0;

      setStatus(`Done! Processed ${results.length} images. Total reduction: ${savedPct}% saved (${formatBytes(totalOrig)} → ${formatBytes(totalNew)})`);
      setProgress(100);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Image compression failed');
      setStatus('Processing failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadAll = async () => {
    if (processed.length === 0) return;
    if (processed.length === 1) {
      downloadBlob(processed[0].blob, processed[0].name);
    } else {
      const zipMap: Record<string, Uint8Array> = {};
      for (const p of processed) {
        const buffer = await p.blob.arrayBuffer();
        zipMap[p.name] = new Uint8Array(buffer);
      }
      await downloadZip(zipMap, 'compressed-images.zip');
    }
  };

  const totalInputBytes = files.reduce((acc, f) => acc + f.size, 0);
  const totalOutputBytes = processed.reduce((acc, f) => acc + f.newSize, 0);

  return (
    <ToolLayout
      title="Image Converter & Compressor"
      description="Convert images between JPG, PNG, and WEBP formats and reduce file size with real-time compression."
      howItWorks="Uses the browser's hardware-accelerated Canvas 2D engine to resize and compress pixels into modern web-optimized formats. Before and after sizes are calculated directly from memory buffers."
      faq="No images are sent across the network. Safe for high-res confidential photos and graphics."
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
              source images
            </span>
            <span className="handwritten-hint">(drop files or browse)</span>
          </div>

          <Dropzone
            accept="image/*"
            onFilesSelected={handleFilesSelected}
            title="Select images to compress"
            subtitle="JPG · PNG · WEBP · BMP"
          />

          {files.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{files.length} images queued</span>
              <button onClick={handleClear} className="btn-secondary" style={{ color: '#ef4444' }}>
                clear all
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
                  <path d="M12 20h9"></path>
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                </svg>
              </span>
              compression settings
            </span>
            <span className="handwritten-hint">(format &amp; quality)</span>
          </div>

          <div className="control-grid">
            <div className="control-field">
              <label className="control-label">target format</label>
              <select
                className="craft-select"
                value={targetFormat}
                onChange={e => setTargetFormat(e.target.value as any)}
              >
                <option value="image/webp">WEBP (Modern &amp; Smallest)</option>
                <option value="image/jpeg">JPEG (Universal)</option>
                <option value="image/png">PNG (Lossless)</option>
              </select>
            </div>

            <div className="control-field">
              <label className="control-label">quality ({Math.round(quality * 100)}%)</label>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={quality}
                onChange={e => setQuality(parseFloat(e.target.value))}
                style={{ accentColor: 'var(--mint-primary)', marginTop: '8px' }}
                disabled={targetFormat === 'image/png'}
              />
            </div>

            <label style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '11px' }}>
              <input
                type="checkbox"
                checked={resizeEnabled}
                onChange={e => setResizeEnabled(e.target.checked)}
                style={{ accentColor: 'var(--mint-primary)' }}
              />
              <span>Cap maximum width (e.g. 1920px Full HD)</span>
            </label>

            {resizeEnabled && (
              <div className="control-field" style={{ gridColumn: '1 / -1' }}>
                <label className="control-label">max width (pixels)</label>
                <input
                  type="number"
                  className="craft-input"
                  value={maxWidth}
                  onChange={e => setMaxWidth(parseInt(e.target.value, 10) || 0)}
                />
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
            <span className="handwritten-hint">(compression telemetry)</span>
          </div>

          <div className="stats-row">
            <div className="stat-item">
              <span className="stat-label">files</span>
              <span className="stat-value">{files.length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">original</span>
              <span className="stat-value">{formatBytes(totalInputBytes)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">compressed</span>
              <span className="stat-value">{processed.length > 0 ? formatBytes(totalOutputBytes) : '—'}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">saved</span>
              <span className="stat-value" style={{ color: 'var(--mint-primary)' }}>
                {processed.length > 0 && totalInputBytes > 0
                  ? `${Math.max(0, Math.round(((totalInputBytes - totalOutputBytes) / totalInputBytes) * 100))}%`
                  : '0%'}
              </span>
            </div>
          </div>

          <div className={`status-box ${errorMessage ? 'error' : isProcessing ? 'active-progress' : ''}`}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="pulse-dot" style={{ backgroundColor: errorMessage ? '#ef4444' : undefined }}></span>
              <span>{errorMessage || status}</span>
            </div>
            {isProcessing && <span>{progress}%</span>}
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handleProcess}
              disabled={files.length === 0 || isProcessing}
              className="btn-primary-mint"
              style={{ flex: 1 }}
            >
              <span>compress &amp; convert ({files.length})</span>
              <span>→</span>
            </button>
            {processed.length > 0 && (
              <button onClick={handleDownloadAll} className="btn-secondary">
                download {processed.length > 1 ? 'zip' : 'file'}
              </button>
            )}
          </div>
        </>
      }
      fileSequenceContent={
        processed.length > 0 ? (
          <div className="queue-box">
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Processed Results ({processed.length} files)
            </div>
            {processed.map((item, idx) => {
              const diff = item.originalSize - item.newSize;
              const pct = item.originalSize > 0 ? Math.round((diff / item.originalSize) * 100) : 0;
              return (
                <div key={idx} className="queue-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                    <img src={item.previewUrl} alt={item.name} className="queue-thumb" />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        ↳ {formatBytes(item.originalSize)} → {formatBytes(item.newSize)} ({pct >= 0 ? `${pct}% smaller` : `${Math.abs(pct)}% larger`})
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => downloadBlob(item.blob, item.name)}
                    className="btn-secondary"
                    style={{ padding: '6px 12px' }}
                  >
                    download
                  </button>
                </div>
              );
            })}
          </div>
        ) : undefined
      }
    />
  );
};
