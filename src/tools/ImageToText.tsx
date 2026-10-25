import React, { useState } from 'react';
import { ToolLayout } from '../components/ToolLayout';
import { Dropzone } from '../components/Dropzone';
import { formatBytes, validateFileSize, validateFileType, downloadBlob } from '../utils/file';
import { runOcrOnImage, preprocessImageForOcr } from '../utils/tesseract';
import { QueuedFile } from '../types';

export const ImageToTextTool: React.FC = () => {
  const [files, setFiles] = useState<QueuedFile[]>([]);
  const [language, setLanguage] = useState<string>('eng');
  const [applyGrayscale, setApplyGrayscale] = useState<boolean>(true);
  const [applyContrast, setApplyContrast] = useState<boolean>(false);
  const [outputFileName, setOutputFileName] = useState<string>('ocr-text.txt');

  const [extractedText, setExtractedText] = useState<string>('');
  const [status, setStatus] = useState<string>('Select one or more images for OCR');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

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
        ['.png', '.jpg', '.jpeg', '.webp', '.bmp', '.tiff', '.gif']
      );
      if (!typeCheck.valid) {
        setErrorMessage(typeCheck.error || 'Unsupported file format');
        return;
      }

      valid.push({
        id: 'ocr_' + Math.random().toString(36).substring(2, 9),
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        previewUrl: URL.createObjectURL(file)
      });
    });

    setFiles(prev => [...prev, ...valid]);
    setStatus(`${valid.length} image(s) queued for optical character recognition`);
  };

  const handleClear = () => {
    files.forEach(f => {
      if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
    });
    setFiles([]);
    setExtractedText('');
    setErrorMessage(null);
    setStatus('Queue cleared');
    setProgress(0);
  };

  const handleRunOcr = async () => {
    if (files.length === 0 || isProcessing) return;
    setIsProcessing(true);
    setErrorMessage(null);
    setStatus('Initializing OCR engine...');
    setProgress(5);

    try {
      let combined = '';

      for (let i = 0; i < files.length; i++) {
        const item = files[i];
        setStatus(`Recognizing text in image ${i + 1} of ${files.length} (${item.name})...`);

        // Load image into canvas for preprocessing
        const img = new Image();
        img.src = item.previewUrl!;
        await new Promise((res, rej) => {
          img.onload = res;
          img.onerror = () => rej(new Error(`Failed to load "${item.name}"`));
        });

        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Could not create canvas context');
        ctx.drawImage(img, 0, 0);

        const processedCanvas = preprocessImageForOcr(canvas, {
          grayscale: applyGrayscale,
          contrast: applyContrast
        });

        const recognizedText = await runOcrOnImage(
          processedCanvas,
          language,
          (pct) => {
            const overall = Math.round(((i + pct / 100) / files.length) * 100);
            setProgress(overall);
          }
        );

        combined += `--- File: ${item.name} ---\n` + (recognizedText || '[No text found]') + '\n\n';
      }

      setExtractedText(combined.trim());
      setStatus(`Completed OCR for ${files.length} file(s)`);
      setProgress(100);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'OCR failed');
      setStatus('OCR error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = () => {
    if (!extractedText) return;
    navigator.clipboard.writeText(extractedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!extractedText) return;
    const blob = new Blob([extractedText], { type: 'text/plain;charset=utf-8' });
    downloadBlob(blob, outputFileName || 'ocr-text.txt');
  };

  const totalBytes = files.reduce((acc, f) => acc + f.size, 0);

  return (
    <ToolLayout
      title="Image to Text (OCR)"
      description="Extract written or printed text from images and screenshots locally in your browser with support for English and Hindi."
      howItWorks="Runs WebAssembly-compiled Tesseract.js directly inside your browser. All trained models and workers are self-hosted locally without making any external API or telemetry calls."
      faq="All processing runs entirely on your device CPU. No images or text are transmitted over the network."
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
            <span className="handwritten-hint">(drop images or browse)</span>
          </div>

          <Dropzone
            accept="image/*"
            onFilesSelected={handleFilesSelected}
            title="Select images for OCR"
            subtitle="PNG · JPG · WEBP · Screenshots · Documents"
          />

          {files.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{files.length} image(s) queued</span>
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
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
              </span>
              ocr engine parameters
            </span>
            <span className="handwritten-hint">(language &amp; filters)</span>
          </div>

          <div className="control-grid">
            <div className="control-field" style={{ gridColumn: '1 / -1' }}>
              <label className="control-label">recognition language</label>
              <select className="craft-select" value={language} onChange={e => setLanguage(e.target.value)}>
                <option value="eng">English (eng)</option>
                <option value="hin">Hindi (hin)</option>
                <option value="eng+hin">English + Hindi (eng+hin)</option>
              </select>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '11px' }}>
              <input
                type="checkbox"
                checked={applyGrayscale}
                onChange={e => setApplyGrayscale(e.target.checked)}
                style={{ accentColor: 'var(--mint-primary)' }}
              />
              <span>Grayscale filter</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '11px' }}>
              <input
                type="checkbox"
                checked={applyContrast}
                onChange={e => setApplyContrast(e.target.checked)}
                style={{ accentColor: 'var(--mint-primary)' }}
              />
              <span>High contrast threshold</span>
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
              recognized text
            </span>
            <span className="handwritten-hint">(plain text)</span>
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
              <span className="stat-label">engine</span>
              <span className="stat-value">tesseract.js</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">target</span>
              <span className="stat-value">{outputFileName}</span>
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
                placeholder="ocr-output.txt"
              />
            </div>
            <button
              onClick={handleRunOcr}
              disabled={files.length === 0 || isProcessing}
              className="btn-primary-mint"
            >
              <span>extract text (ocr)</span>
              <span>→</span>
            </button>
          </div>
        </>
      }
      fileSequenceContent={
        extractedText ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: 600 }}>OCR Result</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={handleCopy} className="btn-secondary">
                  {copied ? '✓ copied!' : 'copy text'}
                </button>
                <button onClick={handleDownload} className="btn-primary-mint" style={{ padding: '6px 14px', fontSize: '12px' }}>
                  download .txt
                </button>
              </div>
            </div>
            <textarea
              className="craft-textarea"
              style={{ minHeight: '300px', fontFamily: 'var(--font-mono)', lineHeight: 1.6 }}
              value={extractedText}
              onChange={e => setExtractedText(e.target.value)}
            />
          </div>
        ) : undefined
      }
    />
  );
};
