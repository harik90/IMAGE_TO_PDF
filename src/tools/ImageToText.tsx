import React, { useState, useRef } from 'react';
import { ToolLayout } from '../components/ToolLayout';
import { Dropzone } from '../components/Dropzone';
import { formatBytes, validateFileSize, validateFileType } from '../utils/file';
import {
  runOcrOnImage,
  preprocessImageForOcr,
  OcrResultWord,
  DEFAULT_PREPROCESSING
} from '../utils/tesseract';
import { QueuedFile } from '../types';
import { OcrResultViewer } from '../components/OcrResultViewer';
import { ScanText, Sliders, XCircle, Play } from 'lucide-react';

export const ImageToTextTool: React.FC = () => {
  const [files, setFiles] = useState<QueuedFile[]>([]);
  const [language, setLanguage] = useState<string>('hin+eng');
  const [applyBinarization, setApplyBinarization] = useState<boolean>(true);
  const [applyDenoise, setApplyDenoise] = useState<boolean>(true);
  const [applyAutoContrast, setApplyAutoContrast] = useState<boolean>(true);
  const [outputFileName, setOutputFileName] = useState<string>('ocr-text.txt');

  const [extractedText, setExtractedText] = useState<string>('');
  const [extractedMarkdown, setExtractedMarkdown] = useState<string>('');
  const [words, setWords] = useState<OcrResultWord[]>([]);
  const [avgConfidence, setAvgConfidence] = useState<number>(0);

  const [previewOriginalUrl, setPreviewOriginalUrl] = useState<string | undefined>(undefined);
  const [previewProcessedUrl, setPreviewProcessedUrl] = useState<string | undefined>(undefined);

  const [status, setStatus] = useState<string>('Select one or more images for OCR');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

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
    setExtractedMarkdown('');
    setWords([]);
    setAvgConfidence(0);
    setPreviewOriginalUrl(undefined);
    setPreviewProcessedUrl(undefined);
    setErrorMessage(null);
    setStatus('Queue cleared');
    setProgress(0);
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsProcessing(false);
    setStatus('OCR recognition cancelled');
  };

  const handleRunOcr = async () => {
    if (files.length === 0 || isProcessing) return;
    setIsProcessing(true);
    setErrorMessage(null);
    setStatus('Initializing OCR engine...');
    setProgress(5);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      let combinedText = '';
      let combinedMarkdown = '';
      const collectedWords: OcrResultWord[] = [];
      let totalConfidenceSum = 0;

      for (let i = 0; i < files.length; i++) {
        if (controller.signal.aborted) throw new Error('OCR cancelled');

        const item = files[i];
        setStatus(`Recognizing image ${i + 1} of ${files.length} (${item.name})...`);

        // Load image into canvas for high quality preprocessing
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

        if (i === 0) {
          setPreviewOriginalUrl(item.previewUrl);
        }

        const processedCanvas = preprocessImageForOcr(canvas, {
          ...DEFAULT_PREPROCESSING,
          autoContrast: applyAutoContrast,
          binarize: applyBinarization,
          denoise: applyDenoise
        });

        if (i === 0) {
          setPreviewProcessedUrl(processedCanvas.toDataURL('image/jpeg', 0.85));
        }

        const ocrResult = await runOcrOnImage(
          processedCanvas,
          language,
          undefined,
          (pct, msg) => {
            const overallPct = Math.round(((i + pct / 100) / files.length) * 90);
            setProgress(overallPct);
            setStatus(`Image ${i + 1}/${files.length}: ${msg} (${pct}%)`);
          },
          controller.signal
        );

        collectedWords.push(...ocrResult.words);
        totalConfidenceSum += ocrResult.confidence;

        const headerTitle = files.length > 1 ? `### ${item.name}\n\n` : '';
        combinedText += (files.length > 1 ? `--- ${item.name} ---\n` : '') + ocrResult.text + '\n\n';
        combinedMarkdown += headerTitle + ocrResult.markdown + '\n\n';
      }

      setExtractedText(combinedText.trim());
      setExtractedMarkdown(combinedMarkdown.trim());
      setWords(collectedWords);
      setAvgConfidence(files.length > 0 ? Math.round(totalConfidenceSum / files.length) : 0);
      setStatus(`Completed: recognized ${files.length} image(s)`);
      setProgress(100);
    } catch (err: any) {
      if (err.message?.includes('cancelled')) {
        setStatus('OCR operation cancelled');
      } else {
        console.error(err);
        setErrorMessage(err.message || 'OCR processing failed');
        setStatus('Processing failed');
      }
    } finally {
      setIsProcessing(false);
      abortControllerRef.current = null;
    }
  };

  const totalBytes = files.reduce((acc, f) => acc + f.size, 0);

  return (
    <ToolLayout
      title="Image to Text (OCR)"
      description="Extract printed Hindi and English text from screenshots, documents, and photos using self-hosted 300 DPI neural models."
      howItWorks="Images are automatically pre-processed using Otsu binarization, histogram contrast stretch, and 3x3 median noise reduction before running through Tesseract.js neural LSTM models."
      faq="Runs completely in memory inside your browser. No images are sent to any cloud API or external service."
      amberCardContent={
        <>
          <div className="card-topline">
            <span className="card-tag">
              <span className="glyph-badge">
                <ScanText size={14} />
              </span>
              source images
            </span>
            <span className="handwritten-hint">(drop images or browse)</span>
          </div>

          <Dropzone
            accept="image/*"
            multiple={true}
            onFilesSelected={handleFilesSelected}
            title={files.length > 0 ? `${files.length} image(s) selected` : 'Select images or drop here'}
            subtitle={files.length > 0 ? formatBytes(totalBytes) : 'Supports PNG, JPG, WEBP, BMP up to 50MB each'}
          />

          {files.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                {files.length} image(s) queued ({formatBytes(totalBytes)})
              </span>
              <button
                type="button"
                onClick={handleClear}
                className="btn-secondary-compact"
                style={{ color: '#ef4444' }}
              >
                clear queue
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
                <Sliders size={14} />
              </span>
              recognition settings
            </span>
            <span className="handwritten-hint">(models &amp; filters)</span>
          </div>

          <div className="control-grid">
            <div className="control-field" style={{ gridColumn: '1 / -1' }}>
              <label className="control-label">language model</label>
              <select
                className="craft-select"
                value={language}
                onChange={e => setLanguage(e.target.value)}
              >
                <option value="hin+eng">Hindi + English (hin+eng) · Recommended</option>
                <option value="hin">Hindi only (hin)</option>
                <option value="eng">English only (eng)</option>
              </select>
            </div>

            <div className="control-field">
              <label className="toggle-label-inline">
                <input
                  type="checkbox"
                  checked={applyBinarization}
                  onChange={e => setApplyBinarization(e.target.checked)}
                  className="toggle-checkbox"
                />
                <span>Otsu Binarization</span>
              </label>
            </div>

            <div className="control-field">
              <label className="toggle-label-inline">
                <input
                  type="checkbox"
                  checked={applyAutoContrast}
                  onChange={e => setApplyAutoContrast(e.target.checked)}
                  className="toggle-checkbox"
                />
                <span>Auto-Contrast Stretch</span>
              </label>
            </div>

            <div className="control-field">
              <label className="toggle-label-inline">
                <input
                  type="checkbox"
                  checked={applyDenoise}
                  onChange={e => setApplyDenoise(e.target.checked)}
                  className="toggle-checkbox"
                />
                <span>Median Denoise (3x3)</span>
              </label>
            </div>
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
              action &amp; status
            </span>
            <span className="handwritten-hint">(extract &amp; export)</span>
          </div>

          <div className="stats-row">
            <div className="stat-item">
              <span className="stat-label">files</span>
              <span className="stat-value">{files.length} img</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">payload</span>
              <span className="stat-value">{formatBytes(totalBytes)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">model</span>
              <span className="stat-value">{language}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">output</span>
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
            <div style={{ flex: 1, minWidth: '180px' }}>
              <input
                type="text"
                className="craft-input"
                value={outputFileName}
                onChange={e => setOutputFileName(e.target.value)}
                placeholder="ocr-text.txt"
              />
            </div>

            {isProcessing ? (
              <button
                type="button"
                onClick={handleCancel}
                className="btn-secondary-compact"
                style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
              >
                <XCircle size={14} />
                <span>Cancel</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleRunOcr}
                disabled={files.length === 0}
                className="btn-primary-mint"
              >
                <span>Extract Text</span>
                <span>→</span>
              </button>
            )}
          </div>
        </>
      }
      fileSequenceContent={
        extractedText ? (
          <OcrResultViewer
            text={extractedText}
            markdown={extractedMarkdown}
            confidence={avgConfidence}
            words={words}
            originalImageUrl={previewOriginalUrl}
            processedImageUrl={previewProcessedUrl}
            fileName={outputFileName}
            onTextChange={setExtractedText}
            onMarkdownChange={setExtractedMarkdown}
          />
        ) : undefined
      }
    />
  );
};
