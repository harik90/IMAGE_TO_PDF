import React, { useState, useRef } from 'react';
import { ToolLayout } from '../components/ToolLayout';
import { Dropzone } from '../components/Dropzone';
import { formatBytes, validateFileSize, validateFileType } from '../utils/file';
import { loadPdfDocument, extractTextFromPdfPage, renderPdfPageToCanvas } from '../utils/pdf';
import {
  runOcrOnImage,
  preprocessImageForOcr,
  detectGarbageText,
  OcrResultWord,
  DEFAULT_PREPROCESSING
} from '../utils/tesseract';
import { OcrResultViewer } from '../components/OcrResultViewer';
import { FileText, Sliders, XCircle, Play } from 'lucide-react';

export const PdfToTextTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [extractedMarkdown, setExtractedMarkdown] = useState<string>('');
  const [words, setWords] = useState<OcrResultWord[]>([]);
  const [avgConfidence, setAvgConfidence] = useState<number>(0);

  const [previewOriginalUrl, setPreviewOriginalUrl] = useState<string | undefined>(undefined);
  const [previewProcessedUrl, setPreviewProcessedUrl] = useState<string | undefined>(undefined);

  const [enableOcrFallback, setEnableOcrFallback] = useState<boolean>(true);
  const [ocrLanguage, setOcrLanguage] = useState<string>('hin+eng');
  const [applyBinarization, setApplyBinarization] = useState<boolean>(true);
  const [outputFileName, setOutputFileName] = useState<string>('extracted-text.txt');

  const [status, setStatus] = useState<string>('Upload a PDF to extract text');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const handleFileSelected = (selectedFiles: FileList | File[]) => {
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

    setFile(chosen);
    setExtractedText('');
    setExtractedMarkdown('');
    setWords([]);
    setAvgConfidence(0);
    setPreviewOriginalUrl(undefined);
    setPreviewProcessedUrl(undefined);
    setOutputFileName(chosen.name.replace(/\.pdf$/i, '') + '.txt');
    setStatus(`Selected "${chosen.name}" (${formatBytes(chosen.size)})`);
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsProcessing(false);
    setStatus('Processing cancelled by user');
  };

  const handleExtract = async () => {
    if (!file || isProcessing) return;
    setIsProcessing(true);
    setErrorMessage(null);
    setStatus('Loading PDF pages...');
    setProgress(5);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const pdf = await loadPdfDocument(file);
      const totalPages = pdf.numPages;
      let fullText = '';
      let fullMarkdown = '';
      const collectedWords: OcrResultWord[] = [];
      let totalConfidenceSum = 0;
      let ocrPagesCount = 0;

      for (let i = 1; i <= totalPages; i++) {
        if (controller.signal.aborted) throw new Error('Extraction cancelled');

        const page = await pdf.getPage(i);
        setStatus(`Extracting text from page ${i} of ${totalPages}...`);
        setProgress(Math.round((i / totalPages) * 85));

        let pageText = await extractTextFromPdfPage(page);
        let pageMd = pageText;

        // Check if page appears scanned or has corrupted/legacy font
        const isCorruptOrScanned = detectGarbageText(pageText, ocrLanguage);

        if ((isCorruptOrScanned || pageText.trim().length < 15) && enableOcrFallback) {
          setStatus(`Page ${i} appears scanned or formatted with legacy fonts. Running 300 DPI OCR (${ocrLanguage})...`);

          // Render high-DPI canvas (scale 4.16 for 300 DPI)
          const rawCanvas = await renderPdfPageToCanvas(page, 4.16);

          if (i === 1) {
            setPreviewOriginalUrl(rawCanvas.toDataURL('image/jpeg', 0.85));
          }

          // Preprocess: Otsu binarize, denoise, auto-contrast
          const preprocessed = preprocessImageForOcr(rawCanvas, {
            ...DEFAULT_PREPROCESSING,
            binarize: applyBinarization
          });

          if (i === 1) {
            setPreviewProcessedUrl(preprocessed.toDataURL('image/jpeg', 0.85));
          }

          const ocrResult = await runOcrOnImage(
            preprocessed,
            ocrLanguage,
            undefined,
            (pct, msg) => {
              setStatus(`Page ${i}: ${msg} (${pct}%)`);
            },
            controller.signal
          );

          pageText = ocrResult.text.trim() ? ocrResult.text : '[No text detected via OCR]';
          pageMd = ocrResult.markdown.trim() ? ocrResult.markdown : pageText;
          collectedWords.push(...ocrResult.words);
          totalConfidenceSum += ocrResult.confidence;
          ocrPagesCount++;
        }

        fullText += `--- Page ${i} ---\n` + (pageText || '[Empty Page]') + '\n\n';
        fullMarkdown += `\n\n---\n*Page ${i}*\n\n` + (pageMd || '[Empty Page]') + '\n';
      }

      setExtractedText(fullText.trim());
      setExtractedMarkdown(fullMarkdown.trim());
      setWords(collectedWords);
      setAvgConfidence(ocrPagesCount > 0 ? Math.round(totalConfidenceSum / ocrPagesCount) : 100);
      setStatus(`Completed extraction: ${totalPages} pages processed`);
      setProgress(100);
    } catch (err: any) {
      if (err.message?.includes('cancelled')) {
        setStatus('Operation cancelled');
      } else {
        console.error(err);
        setErrorMessage(err.message || 'Failed to extract text from PDF');
        setStatus('Extraction failed');
      }
    } finally {
      setIsProcessing(false);
      abortControllerRef.current = null;
    }
  };

  return (
    <ToolLayout
      title="PDF to Text (with 300 DPI OCR)"
      description="Extract digital text or run self-hosted 300 DPI Hindi and English OCR on scanned PDF pages completely in your browser."
      howItWorks="Digital text is parsed preserving line structure. For scanned pages or legacy fonts, the page is rendered at 300 DPI, cleaned with Otsu binarization and auto-contrast, and recognized with local best models."
      faq="Completely client-side in browser memory. Never uploads confidential documents, government forms, or contracts to any server."
      amberCardContent={
        <>
          <div className="card-topline">
            <span className="card-tag">
              <span className="glyph-badge">
                <FileText size={14} />
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
            subtitle={file ? formatBytes(file.size) : 'Single PDF document up to 100MB'}
          />

          {file && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Selected: {file.name}</span>
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setExtractedText('');
                  setExtractedMarkdown('');
                }}
                className="btn-secondary-compact"
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
                <Sliders size={14} />
              </span>
              extraction options
            </span>
            <span className="handwritten-hint">(scanned &amp; digital)</span>
          </div>

          <div className="control-grid">
            <div className="control-field" style={{ gridColumn: '1 / -1' }}>
              <label className="toggle-label-inline">
                <input
                  type="checkbox"
                  checked={enableOcrFallback}
                  onChange={e => setEnableOcrFallback(e.target.checked)}
                  className="toggle-checkbox"
                />
                <span>Auto-run OCR on scanned pages &amp; legacy fonts</span>
              </label>
            </div>

            <div className="control-field">
              <label className="control-label">ocr language</label>
              <select
                className="craft-select"
                value={ocrLanguage}
                onChange={e => setOcrLanguage(e.target.value)}
                disabled={!enableOcrFallback}
              >
                <option value="hin+eng">Hindi + English (hin+eng) · Recommended</option>
                <option value="hin">Hindi only (hin)</option>
                <option value="eng">English only (eng)</option>
              </select>
            </div>

            <div className="control-field">
              <label className="control-label">preprocessing</label>
              <label className="toggle-label-inline" style={{ marginTop: '6px' }}>
                <input
                  type="checkbox"
                  checked={applyBinarization}
                  onChange={e => setApplyBinarization(e.target.checked)}
                  disabled={!enableOcrFallback}
                  className="toggle-checkbox"
                />
                <span>Otsu Binarize &amp; Denoise</span>
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
            <span className="handwritten-hint">(process in memory)</span>
          </div>

          <div className="stats-row">
            <div className="stat-item">
              <span className="stat-label">file</span>
              <span className="stat-value">{file ? '1 PDF' : 'None'}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">payload</span>
              <span className="stat-value">{file ? formatBytes(file.size) : '0 B'}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">engine</span>
              <span className="stat-value">{enableOcrFallback ? 'pdfjs + tesseract' : 'pdfjs native'}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">language</span>
              <span className="stat-value">{ocrLanguage}</span>
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
                placeholder="extracted-text.txt"
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
                onClick={handleExtract}
                disabled={!file}
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
