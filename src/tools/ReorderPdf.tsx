import React, { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import { ToolLayout } from '../components/ToolLayout';
import { Dropzone } from '../components/Dropzone';
import { formatBytes, validateFileSize, validateFileType, downloadBlob } from '../utils/file';
import { loadPdfDocument, renderPdfPageToCanvas } from '../utils/pdf';

interface PageThumbnail {
  originalIndex: number;
  dataUrl: string;
}

export const ReorderPdfTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [pagesOrder, setPagesOrder] = useState<PageThumbnail[]>([]);
  const [outputFileName, setOutputFileName] = useState<string>('reordered.pdf');

  const [status, setStatus] = useState<string>('Select a PDF to reorder or delete pages');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileSelected = async (selectedFiles: FileList | File[]) => {
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

    try {
      setStatus('Rendering page thumbnails...');
      setIsProcessing(true);

      const pdf = await loadPdfDocument(chosen);
      const thumbs: PageThumbnail[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const canvas = await renderPdfPageToCanvas(page, 0.4);
        thumbs.push({
          originalIndex: i - 1,
          dataUrl: canvas.toDataURL('image/jpeg', 0.7)
        });
        canvas.width = 0;
        canvas.height = 0;
      }

      setFile(chosen);
      setPagesOrder(thumbs);
      setOutputFileName(chosen.name.replace(/\.pdf$/i, '') + '-reordered.pdf');
      setStatus(`Loaded ${thumbs.length} pages. Use controls below to reorder or delete pages.`);
    } catch {
      setErrorMessage('This PDF is locked or damaged. Remove the password and try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    setPagesOrder(prev => {
      const next = [...prev];
      const target = direction === 'up' ? index - 1 : index + 1;
      if (target < 0 || target >= next.length) return prev;
      const tmp = next[index];
      next[index] = next[target];
      next[target] = tmp;
      return next;
    });
  };

  const handleDeletePage = (index: number) => {
    setPagesOrder(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!file || pagesOrder.length === 0 || isProcessing) return;
    setIsProcessing(true);
    setErrorMessage(null);
    setStatus('Re-assembling PDF in new sequence...');

    try {
      const bytes = await file.arrayBuffer();
      const srcDoc = await PDFDocument.load(bytes);
      const outDoc = await PDFDocument.create();

      const indices = pagesOrder.map(p => p.originalIndex);
      const copied = await outDoc.copyPages(srcDoc, indices);
      copied.forEach(p => outDoc.addPage(p));

      const outBytes = await outDoc.save();
      const blob = new Blob([outBytes as any], { type: 'application/pdf' });
      downloadBlob(blob, outputFileName || 'reordered.pdf');
      setStatus(`Success! Saved ${pagesOrder.length} pages to ${outputFileName}`);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to reassemble PDF');
      setStatus('Save failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ToolLayout
      title="Reorder & Delete PDF Pages"
      description="Visual thumbnail arranger to re-sequence, duplicate, or delete specific pages from a PDF document."
      howItWorks="Generates local low-res page previews using pdfjs, lets you visually change the page sequence or delete unwanted pages, and writes the new page order using pdf-lib."
      faq="All processing runs entirely on your device in browser memory."
      amberCardContent={
        <>
          <div className="card-topline">
            <span className="card-tag">
              <span className="glyph-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
              </span>
              source pdf
            </span>
            <span className="handwritten-hint">(drop file or browse)</span>
          </div>

          <Dropzone
            accept="application/pdf"
            multiple={false}
            onFilesSelected={handleFileSelected}
            title={file ? file.name : 'Select PDF to reorder'}
            subtitle={file ? `${pagesOrder.length} pages in memory` : 'Single PDF document up to 50MB'}
          />
        </>
      }
      indigoCardContent={
        <>
          <div className="card-topline">
            <span className="card-tag">
              <span className="glyph-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                </svg>
              </span>
              instructions
            </span>
            <span className="handwritten-hint">(visual reordering)</span>
          </div>

          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            <div>Use the arrow buttons under each page thumbnail to shift pages left or right.</div>
            <div style={{ marginTop: '8px', color: 'var(--text-muted)' }}>
              Click the red cross button to delete any unwanted page before saving.
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
            <span className="handwritten-hint">(save sequence)</span>
          </div>

          <div className="stats-row">
            <div className="stat-item">
              <span className="stat-label">file</span>
              <span className="stat-value">{file ? '1 PDF' : 'None'}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">remaining</span>
              <span className="stat-value">{pagesOrder.length} pages</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">tool</span>
              <span className="stat-value">reorder-pdf</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">target</span>
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
                placeholder="reordered.pdf"
              />
            </div>
            <button
              onClick={handleSave}
              disabled={pagesOrder.length === 0 || isProcessing}
              className="btn-primary-mint"
            >
              <span>save reordered pdf</span>
              <span>→</span>
            </button>
          </div>
        </>
      }
      fileSequenceContent={
        pagesOrder.length > 0 ? (
          <div className="queue-box">
            <div className="queue-box-header">
              <div className="queue-box-title-group">
                <span className="queue-box-title">Page Arrangement</span>
                <span className="queue-box-count">({pagesOrder.length} pages in document)</span>
              </div>
              <span className="accent-script-note">*(reorder with arrows or delete pages)*</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '14px', marginTop: '6px' }}>
              {pagesOrder.map((item, index) => (
                <div
                  key={index}
                  style={{
                    background: 'var(--surface-well)',
                    border: '1.5px dotted var(--border-dotted)',
                    borderRadius: 'var(--radius-well)',
                    padding: '10px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>Page {index + 1}</div>
                  <div style={{ width: '100%', height: '140px', background: '#FFFFFF', borderRadius: '6px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dotted var(--border-dotted)' }}>
                    <img
                      src={item.dataUrl}
                      alt={`Page ${index + 1}`}
                      style={{ maxWidth: '100%', maxHeight: '140px', objectFit: 'contain' }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '4px', width: '100%', justifyContent: 'center' }}>
                    <button
                      type="button"
                      onClick={() => handleMove(index, 'up')}
                      disabled={index === 0}
                      className="queue-btn"
                      style={{ width: '28px', height: '26px' }}
                      title="Move left"
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMove(index, 'down')}
                      disabled={index === pagesOrder.length - 1}
                      className="queue-btn"
                      style={{ width: '28px', height: '26px' }}
                      title="Move right"
                    >
                      →
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeletePage(index)}
                      className="queue-btn delete"
                      style={{ width: '28px', height: '26px' }}
                      title="Delete page"
                    >
                      ✕
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
