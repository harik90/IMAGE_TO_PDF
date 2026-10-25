import React, { useState } from 'react';
import { ToolLayout } from '../components/ToolLayout';
import { Dropzone } from '../components/Dropzone';
import { formatBytes, validateFileSize, validateFileType, downloadBlob } from '../utils/file';

export const ResizeImageTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [origWidth, setOrigWidth] = useState<number>(0);
  const [origHeight, setOrigHeight] = useState<number>(0);
  const [width, setWidth] = useState<number>(800);
  const [height, setHeight] = useState<number>(600);
  const [keepAspect, setKeepAspect] = useState<boolean>(true);
  const [resizeMode, setResizeMode] = useState<'custom' | 'pct'>('custom');
  const [percentage, setPercentage] = useState<number>(50);
  const [outputFileName, setOutputFileName] = useState<string>('resized-image.png');

  const [status, setStatus] = useState<string>('Select an image to resize');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileSelected = (selectedFiles: FileList | File[]) => {
    setErrorMessage(null);
    const chosen = selectedFiles[0];
    if (!chosen) return;

    const sizeCheck = validateFileSize(chosen, 50);
    if (!sizeCheck.valid) {
      setErrorMessage(sizeCheck.error || 'File too large');
      return;
    }
    const typeCheck = validateFileType(
      chosen,
      ['image/*'],
      ['.png', '.jpg', '.jpeg', '.webp', '.bmp', '.svg']
    );
    if (!typeCheck.valid) {
      setErrorMessage(typeCheck.error || 'Please select an image file');
      return;
    }

    const url = URL.createObjectURL(chosen);
    const img = new Image();
    img.onload = () => {
      setOrigWidth(img.naturalWidth);
      setOrigHeight(img.naturalHeight);
      setWidth(img.naturalWidth);
      setHeight(img.naturalHeight);
      setFile(chosen);
      setOutputFileName(chosen.name.replace(/\.[^/.]+$/, '') + '-resized.png');
      setStatus(`Loaded "${chosen.name}" (${img.naturalWidth} × ${img.naturalHeight} px)`);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const handleWidthChange = (val: number) => {
    setWidth(val);
    if (keepAspect && origWidth > 0) {
      setHeight(Math.round((val * origHeight) / origWidth));
    }
  };

  const handleHeightChange = (val: number) => {
    setHeight(val);
    if (keepAspect && origHeight > 0) {
      setWidth(Math.round((val * origWidth) / origHeight));
    }
  };

  const handlePercentageChange = (pct: number) => {
    setPercentage(pct);
    if (origWidth > 0 && origHeight > 0) {
      setWidth(Math.round((origWidth * pct) / 100));
      setHeight(Math.round((origHeight * pct) / 100));
    }
  };

  const handleResize = async () => {
    if (!file || width <= 0 || height <= 0 || isProcessing) return;
    setIsProcessing(true);
    setErrorMessage(null);
    setStatus('Resizing image on canvas...');

    try {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.src = url;
      await new Promise(r => (img.onload = r));

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      const blob = await new Promise<Blob>((res, rej) => {
        canvas.toBlob(b => (b ? res(b) : rej(new Error('Failed to generate image blob'))), 'image/png');
      });

      downloadBlob(blob, outputFileName || 'resized.png');
      setStatus(`Success! Resized to ${width} × ${height} px (${formatBytes(blob.size)})`);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Image resize failed');
      setStatus('Resize failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ToolLayout
      title="Resize Image"
      description="Change image dimensions by exact pixel measurements or percentage with aspect ratio preservation."
      howItWorks="Uses high-quality bicubic canvas interpolation directly in the browser with hardware acceleration. Outputs lossless PNG or compressed formats."
      faq="Processed entirely in device RAM. No images are uploaded to any server."
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
              source image
            </span>
            <span className="handwritten-hint">(drop image or browse)</span>
          </div>

          <Dropzone
            accept="image/*"
            multiple={false}
            onFilesSelected={handleFileSelected}
            title={file ? file.name : 'Select image to resize'}
            subtitle={file ? `${origWidth} × ${origHeight} px · ${formatBytes(file.size)}` : 'Single image up to 50MB'}
          />
        </>
      }
      indigoCardContent={
        <>
          <div className="card-topline">
            <span className="card-tag">
              <span className="glyph-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h6v6"></path>
                  <path d="M9 21H3v-6"></path>
                  <path d="M21 3l-7 7"></path>
                  <path d="M3 21l7-7"></path>
                </svg>
              </span>
              dimension target
            </span>
            <span className="handwritten-hint">(width &amp; height)</span>
          </div>

          <div className="control-grid">
            <div className="control-field">
              <label className="control-label">resize mode</label>
              <select
                className="craft-select"
                value={resizeMode}
                onChange={e => {
                  const m = e.target.value as any;
                  setResizeMode(m);
                  if (m === 'pct') handlePercentageChange(percentage);
                }}
                disabled={!file}
              >
                <option value="custom">Exact Pixels (W × H)</option>
                <option value="pct">Percentage Scale (%)</option>
              </select>
            </div>

            {resizeMode === 'pct' ? (
              <div className="control-field">
                <label className="control-label">scale ({percentage}%)</label>
                <input
                  type="range"
                  min="5"
                  max="200"
                  step="5"
                  value={percentage}
                  onChange={e => handlePercentageChange(parseInt(e.target.value, 10))}
                  style={{ accentColor: 'var(--mint-primary)', marginTop: '8px' }}
                  disabled={!file}
                />
              </div>
            ) : (
              <div className="control-field" style={{ display: 'flex', alignItems: 'center', marginTop: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={keepAspect}
                    onChange={e => setKeepAspect(e.target.checked)}
                    style={{ accentColor: 'var(--mint-primary)' }}
                  />
                  <span>Lock aspect ratio</span>
                </label>
              </div>
            )}

            <div className="control-field">
              <label className="control-label">width (px)</label>
              <input
                type="number"
                className="craft-input"
                value={width}
                onChange={e => handleWidthChange(parseInt(e.target.value, 10) || 0)}
                disabled={!file}
              />
            </div>

            <div className="control-field">
              <label className="control-label">height (px)</label>
              <input
                type="number"
                className="craft-input"
                value={height}
                onChange={e => handleHeightChange(parseInt(e.target.value, 10) || 0)}
                disabled={!file}
              />
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
            <span className="handwritten-hint">(pixel geometry)</span>
          </div>

          <div className="stats-row">
            <div className="stat-item">
              <span className="stat-label">original</span>
              <span className="stat-value">{origWidth} × {origHeight}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">target</span>
              <span className="stat-value" style={{ color: 'var(--mint-primary)' }}>{width} × {height}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">tool</span>
              <span className="stat-value">resize-image</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">output</span>
              <span className="stat-value">{outputFileName}</span>
            </div>
          </div>

          <div className={`status-box ${errorMessage ? 'error' : ''}`}>
            <span className="pulse-dot" style={{ backgroundColor: errorMessage ? '#ef4444' : undefined }}></span>
            <span>{errorMessage || status}</span>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <input
                type="text"
                className="craft-input"
                value={outputFileName}
                onChange={e => setOutputFileName(e.target.value)}
                placeholder="resized.png"
              />
            </div>
            <button
              onClick={handleResize}
              disabled={!file || width <= 0 || height <= 0 || isProcessing}
              className="btn-primary-mint"
            >
              <span>resize &amp; download</span>
              <span>→</span>
            </button>
          </div>
        </>
      }
    />
  );
};
