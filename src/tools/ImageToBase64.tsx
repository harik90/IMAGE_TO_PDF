import React, { useState } from 'react';
import { ToolLayout } from '../components/ToolLayout';
import { Dropzone } from '../components/Dropzone';
import { formatBytes, validateFileSize, validateFileType } from '../utils/file';

export const ImageToBase64Tool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [base64String, setBase64String] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileSelected = (selectedFiles: FileList | File[]) => {
    setErrorMessage(null);
    const chosen = selectedFiles[0];
    if (!chosen) return;

    const sizeCheck = validateFileSize(chosen, 20); // 20MB limit for base64
    if (!sizeCheck.valid) {
      setErrorMessage(sizeCheck.error || 'File too large for Base64');
      return;
    }
    const typeCheck = validateFileType(
      chosen,
      ['image/*'],
      ['.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif', '.ico']
    );
    if (!typeCheck.valid) {
      setErrorMessage(typeCheck.error || 'Please select an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setBase64String(result);
      setPreviewUrl(result);
      setFile(chosen);
    };
    reader.readAsDataURL(chosen);
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const rawBytes = file ? file.size : 0;
  const base64Bytes = base64String ? new Blob([base64String]).size : 0;

  return (
    <ToolLayout
      title="Image to Base64"
      description="Convert any image into an inline Data URI / Base64 string for direct embedding into HTML, CSS, or JSON."
      howItWorks="Uses FileReader.readAsDataURL in your browser memory to encode binary bytes into RFC 2397 standard base64 data URIs. No network traffic."
      faq="Useful for single-file web pages, email templates, and icon embedding."
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
            title={file ? file.name : 'Select image to encode'}
            subtitle={file ? formatBytes(file.size) : 'PNG · JPG · WEBP · SVG · GIF'}
          />
        </>
      }
      indigoCardContent={
        <>
          <div className="card-topline">
            <span className="card-tag">
              <span className="glyph-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="16 18 22 12 16 6"></polyline>
                  <polyline points="8 6 2 12 8 18"></polyline>
                </svg>
              </span>
              quick copy snippets
            </span>
            <span className="handwritten-hint">(html &amp; css)</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              onClick={() => copyToClipboard(base64String, 'raw')}
              disabled={!base64String}
              className="btn-secondary"
            >
              {copiedType === 'raw' ? '✓ copied data uri!' : 'copy raw data uri'}
            </button>
            <button
              onClick={() => copyToClipboard(`<img src="${base64String}" alt="${file?.name || 'image'}" />`, 'html')}
              disabled={!base64String}
              className="btn-secondary"
            >
              {copiedType === 'html' ? '✓ copied html tag!' : 'copy html <img> snippet'}
            </button>
            <button
              onClick={() => copyToClipboard(`background-image: url("${base64String}");`, 'css')}
              disabled={!base64String}
              className="btn-secondary"
            >
              {copiedType === 'css' ? '✓ copied css!' : 'copy css background snippet'}
            </button>
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
            <span className="handwritten-hint">(base64 payload)</span>
          </div>

          <div className="stats-row">
            <div className="stat-item">
              <span className="stat-label">binary</span>
              <span className="stat-value">{formatBytes(rawBytes)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">base64</span>
              <span className="stat-value">{formatBytes(base64Bytes)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">overhead</span>
              <span className="stat-value">+33%</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">mime</span>
              <span className="stat-value">{file?.type || '—'}</span>
            </div>
          </div>

          <div className={`status-box ${errorMessage ? 'error' : ''}`}>
            <span className="pulse-dot" style={{ backgroundColor: errorMessage ? '#ef4444' : undefined }}></span>
            <span>{errorMessage || (base64String ? 'Base64 string generated successfully' : 'Awaiting image selection')}</span>
          </div>
        </>
      }
      fileSequenceContent={
        base64String ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: 600 }}>Encoded Output</span>
              <button onClick={() => copyToClipboard(base64String, 'raw')} className="btn-primary-mint" style={{ padding: '6px 14px', fontSize: '12px' }}>
                {copiedType === 'raw' ? '✓ copied' : 'copy full string'}
              </button>
            </div>
            <textarea
              readOnly
              className="craft-textarea"
              style={{ minHeight: '160px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}
              value={base64String}
            />
          </div>
        ) : undefined
      }
    />
  );
};
