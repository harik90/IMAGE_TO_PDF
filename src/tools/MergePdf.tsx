import React, { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import { ToolLayout } from '../components/ToolLayout';
import { Dropzone } from '../components/Dropzone';
import { formatBytes, validateFileSize, validateFileType, downloadBlob } from '../utils/file';
import { QueuedFile } from '../types';
import { ArrowUp, ArrowDown, X, FileText } from 'lucide-react';

export const MergePdfTool: React.FC = () => {
  const [files, setFiles] = useState<QueuedFile[]>([]);
  const [outputFileName, setOutputFileName] = useState<string>('merged-document.pdf');
  const [status, setStatus] = useState<string>('Select two or more PDFs to combine');
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
      const typeCheck = validateFileType(file, ['application/pdf'], ['.pdf']);
      if (!typeCheck.valid) {
        setErrorMessage(typeCheck.error || 'Please upload PDF files only');
        return;
      }

      valid.push({
        id: 'pdf_' + Math.random().toString(36).substring(2, 9),
        file,
        name: file.name,
        size: file.size,
        type: file.type
      });
    });

    setFiles(prev => [...prev, ...valid]);
    setStatus(`${valid.length} PDF(s) added to merge queue`);
  };

  const handleClear = () => {
    setFiles([]);
    setErrorMessage(null);
    setStatus('Queue cleared');
    setProgress(0);
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

  const handleRemove = (index: number) => {
    setFiles(prev => {
      const next = [...prev];
      next.splice(index, 1);
      return next;
    });
  };

  const handleMerge = async () => {
    if (files.length < 2 || isProcessing) return;
    setIsProcessing(true);
    setErrorMessage(null);
    setStatus('Initializing merge document...');
    setProgress(5);

    try {
      const mergedPdf = await PDFDocument.create();

      for (let i = 0; i < files.length; i++) {
        const item = files[i];
        setStatus(`Merging "${item.name}" (${i + 1} of ${files.length})...`);
        setProgress(Math.round(((i + 1) / files.length) * 85));

        const bytes = await item.file.arrayBuffer();
        let srcDoc: PDFDocument;
        try {
          srcDoc = await PDFDocument.load(bytes);
        } catch {
          throw new Error(`This PDF ("${item.name}") is locked or damaged. Remove the password and try again.`);
        }

        const copiedPages = await mergedPdf.copyPages(srcDoc, srcDoc.getPageIndices());
        copiedPages.forEach(page => mergedPdf.addPage(page));
      }

      setStatus('Saving combined document...');
      setProgress(95);

      const mergedBytes = await mergedPdf.save();
      const blob = new Blob([mergedBytes as any], { type: 'application/pdf' });

      let filename = outputFileName.trim() || 'merged-document.pdf';
      if (!filename.toLowerCase().endsWith('.pdf')) filename += '.pdf';

      downloadBlob(blob, filename);
      setStatus(`Success! Merged ${files.length} PDFs into ${filename} (${formatBytes(blob.size)})`);
      setProgress(100);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'PDF merge failed');
      setStatus('Merge failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const totalBytes = files.reduce((acc, f) => acc + f.size, 0);

  return (
    <ToolLayout
      title="Merge PDF"
      description="Combine multiple PDF documents into a single organized file with full page order control."
      howItWorks="Loads each PDF's page tree in-memory using pdf-lib, copies all page dictionaries, and writes a unified cross-reference table into a new document. No file leaves your browser."
      faq="Encrypted or password-protected PDFs must have password protection removed first before merging."
      amberCardContent={
        <>
          <div className="card-topline">
            <span className="card-tag">
              <span className="glyph-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="12" y1="18" x2="12" y2="12"></line>
                  <line x1="9" y1="15" x2="15" y2="15"></line>
                </svg>
              </span>
              add pdfs
            </span>
            <span className="handwritten-hint">(drop files or browse)</span>
          </div>

          <Dropzone
            accept="application/pdf"
            onFilesSelected={handleFilesSelected}
            title="Select PDF files to merge"
            subtitle="Add 2 or more PDF documents"
          />

          {files.length > 0 && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setFiles(prev => [...prev].reverse())}
                className="btn-secondary"
              >
                reverse order
              </button>
              <button
                onClick={handleClear}
                className="btn-secondary"
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
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="16 18 22 12 16 6"></polyline>
                  <polyline points="8 6 2 12 8 18"></polyline>
                </svg>
              </span>
              merge settings
            </span>
            <span className="handwritten-hint">(sequence preview)</span>
          </div>

          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            <div>PDFs will be concatenated in the exact sequence listed below.</div>
            <div style={{ marginTop: '8px', color: 'var(--text-muted)' }}>
              Use the arrow buttons in the sequence list to rearrange the order of documents prior to merging.
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
            <span className="handwritten-hint">(merged document)</span>
          </div>

          <div className="stats-row">
            <div className="stat-item">
              <span className="stat-label">files</span>
              <span className="stat-value">{files.length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">total size</span>
              <span className="stat-value">{formatBytes(totalBytes)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">tool</span>
              <span className="stat-value">merge-pdf</span>
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
                placeholder="merged-document.pdf"
              />
            </div>
            <button
              onClick={handleMerge}
              disabled={files.length < 2 || isProcessing}
              className="btn-primary-mint"
            >
              <span>merge {files.length} pdfs</span>
              <span>→</span>
            </button>
          </div>
        </>
      }
      fileSequenceContent={
        files.length > 0 ? (
          <div className="queue-box">
            <div className="queue-box-header">
              <div className="queue-box-title-group">
                <span className="queue-box-title">Document Sequence</span>
                <span className="queue-box-count">({files.length} PDFs to combine)</span>
              </div>
              <span className="accent-script-note">*(merge order: top to bottom)*</span>
            </div>

            <div className="queue-list">
              {files.map((item, index) => (
                <div key={item.id} className="queue-row">
                  <div className="queue-row-left">
                    <span className="queue-idx">
                      {String(index + 1).padStart(2, '0')}.
                    </span>
                    <div className="queue-thumb-wrap" style={{ background: 'var(--surface-well)' }}>
                      <FileText size={20} style={{ color: 'var(--accent-mint)' }} />
                    </div>
                    <div className="queue-meta">
                      <div className="queue-name" title={item.name}>
                        {item.name}
                      </div>
                      <div className="queue-sub">
                        <span>{formatBytes(item.size)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="queue-actions">
                    <button
                      type="button"
                      onClick={() => handleMove(index, 'up')}
                      disabled={index === 0}
                      className="queue-btn"
                      title="Move up"
                      aria-label="Move up"
                    >
                      <ArrowUp size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMove(index, 'down')}
                      disabled={index === files.length - 1}
                      className="queue-btn"
                      title="Move down"
                      aria-label="Move down"
                    >
                      <ArrowDown size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemove(index)}
                      className="queue-btn delete"
                      title="Remove from queue"
                      aria-label="Remove"
                    >
                      <X size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : undefined
      }
    />
  );
};
