import React, { useState } from 'react';
import { ToolLayout } from '../components/ToolLayout';
import { Dropzone } from '../components/Dropzone';
import { formatBytes, validateFileSize, validateFileType, downloadBlob } from '../utils/file';
import { loadPdfDocument, extractTextFromPdfPage, renderPdfPageToCanvas } from '../utils/pdf';
import { runOcrOnImage } from '../utils/tesseract';

export const PdfToTextTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [enableOcrFallback, setEnableOcrFallback] = useState<boolean>(true);
  const [ocrLanguage, setOcrLanguage] = useState<string>('eng');
  const [outputFileName, setOutputFileName] = useState<string>('extracted-text.txt');

  const [status, setStatus] = useState<string>('Upload a PDF to extract text');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const handleFileSelected = (selectedFiles: FileList | File[]) => {
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

    setFile(chosen);
    setExtractedText('');
    setOutputFileName(chosen.name.replace(/\.pdf$/i, '') + '.txt');
    setStatus(`Selected "${chosen.name}" (${formatBytes(chosen.size)})`);
  };

  const handleExtract = async () => {
    if (!file || isProcessing) return;
    setIsProcessing(true);
    setErrorMessage(null);
    setStatus('Loading PDF pages...');
    setProgress(5);

    try {
      const pdf = await loadPdfDocument(file);
      const totalPages = pdf.numPages;
      let fullText = '';

      for (let i = 1; i <= totalPages; i++) {
        const page = await pdf.getPage(i);
        setStatus(`Extracting text from page ${i} of ${totalPages}...`);
        setProgress(Math.round((i / totalPages) * 90));

        let pageText = await extractTextFromPdfPage(page);

        // Scanned page check: if fewer than 15 chars and OCR fallback enabled, run OCR
        if (pageText.trim().length < 15 && enableOcrFallback) {
          setStatus(`Page ${i} appears scanned. Running OCR (${ocrLanguage})...`);
          const canvas = await renderPdfPageToCanvas(page, 2.5);
          const ocrText = await runOcrOnImage(canvas, ocrLanguage);
          pageText = ocrText.trim() ? ocrText : '[No text detected via OCR]';
        }

        fullText += `--- Page ${i} ---\n` + (pageText || '[Empty Page]') + '\n\n';
      }

      setExtractedText(fullText.trim());
      setStatus(`Completed extraction: ${totalPages} pages processed`);
      setProgress(100);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to extract text from PDF');
      setStatus('Extraction failed');
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
    downloadBlob(blob, outputFileName || 'extracted-text.txt');
  };

  return (
    <ToolLayout
      title="PDF to Text (with OCR)"
      description="Extract digital text and run optical character recognition on scanned PDF pages completely in your browser."
      howItWorks="Digital text is parsed with coordinates preserved using pdfjs-dist. For scanned pages with few characters, the page is rendered to high-res canvas at 2.5x and optical character recognition is performed locally using self-hosted Tesseract."
      faq="Never sends files to any server. Completely private and safe for confidential documents, tax forms, and contracts."
      amberCardContent={
        <>
          <div className="card-topline">
            <span className="card-tag">
              <span className="glyph-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
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
            subtitle={file ? formatBytes(file.size) : 'Single PDF document up to 50MB'}
          />

          {file && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Selected: {file.name}</span>
              <button
                onClick={() => { setFile(null); setExtractedText(''); }}
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
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
              </span>
              extraction options
            </span>
            <span className="handwritten-hint">(scanned &amp; digital)</span>
          </div>

          <div className="control-grid">
            <div className="control-field" style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px' }}>
                <input
                  type="checkbox"
                  checked={enableOcrFallback}
                  onChange={e => setEnableOcrFallback(e.target.checked)}
                  style={{ accentColor: 'var(--mint-primary)' }}
                />
                <span>Auto-run OCR if page contains scanned images or no text</span>
              </label>
            </div>

            <div className="control-field" style={{ gridColumn: '1 / -1' }}>
              <label className="control-label">ocr language</label>
              <select
                className="craft-select"
                value={ocrLanguage}
                onChange={e => setOcrLanguage(e.target.value)}
                disabled={!enableOcrFallback}
              >
                <option value="eng">English (eng)</option>
                <option value="hin">Hindi (hin)</option>
                <option value="eng+hin">English + Hindi (eng+hin)</option>
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
              text output
            </span>
            <span className="handwritten-hint">(plain text)</span>
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
              <span className="stat-label">tool</span>
              <span className="stat-value">pdf-to-text</span>
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
            <div style={{ flex: 1, minWidth: '200px' }}>
              <input
                type="text"
                className="craft-input"
                value={outputFileName}
                onChange={e => setOutputFileName(e.target.value)}
                placeholder="extracted-text.txt"
              />
            </div>
            <button
              onClick={handleExtract}
              disabled={!file || isProcessing}
              className="btn-primary-mint"
            >
              <span>extract text</span>
              <span>→</span>
            </button>
          </div>
        </>
      }
      fileSequenceContent={
        extractedText ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: 600 }}>Extracted Content</span>
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
