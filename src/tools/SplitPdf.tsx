import React, { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import { ToolLayout } from '../components/ToolLayout';
import { Dropzone } from '../components/Dropzone';
import { formatBytes, validateFileSize, validateFileType, downloadBlob, downloadZip } from '../utils/file';

export const SplitPdfTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [rangeInput, setRangeInput] = useState<string>('1');
  const [splitMode, setSplitMode] = useState<'single' | 'zip'>('single');
  const [outputFileName, setOutputFileName] = useState<string>('split-document.pdf');

  const [status, setStatus] = useState<string>('Select a PDF to extract or split pages');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
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
      const bytes = await chosen.arrayBuffer();
      const pdf = await PDFDocument.load(bytes);
      const count = pdf.getPageCount();

      setFile(chosen);
      setTotalPages(count);
      setRangeInput(`1-${Math.min(count, 3)}`);
      setOutputFileName(chosen.name.replace(/\.pdf$/i, '') + '-extracted.pdf');
      setStatus(`Loaded "${chosen.name}" (${count} pages, ${formatBytes(chosen.size)})`);
    } catch {
      setErrorMessage('This PDF is locked or damaged. Remove the password and try again.');
    }
  };

  // Parse and validate page ranges: e.g. "1-3, 5, 8-10"
  function parsePageRange(input: string, maxPages: number): { pages: number[]; error?: string } {
    const cleaned = input.replace(/\s+/g, '');
    if (!cleaned) return { pages: [], error: 'Please enter a page range (e.g. 1-3, 5)' };

    const parts = cleaned.split(',');
    const pagesSet = new Set<number>();

    for (const part of parts) {
      if (part.includes('-')) {
        const [startStr, endStr] = part.split('-');
        const start = parseInt(startStr, 10);
        const end = parseInt(endStr, 10);
        if (isNaN(start) || isNaN(end) || start > end || start < 1) {
          return { pages: [], error: `Invalid page range format: "${part}"` };
        }
        if (end > maxPages) {
          return { pages: [], error: `Page ${end} is outside document boundaries (1-${maxPages})` };
        }
        for (let p = start; p <= end; p++) pagesSet.add(p);
      } else {
        const p = parseInt(part, 10);
        if (isNaN(p) || p < 1) {
          return { pages: [], error: `Invalid page number: "${part}"` };
        }
        if (p > maxPages) {
          return { pages: [], error: `Page ${p} is outside document boundaries (1-${maxPages})` };
        }
        pagesSet.add(p);
      }
    }

    const sortedPages = Array.from(pagesSet).sort((a, b) => a - b);
    if (sortedPages.length === 0) {
      return { pages: [], error: 'No valid pages parsed.' };
    }
    return { pages: sortedPages };
  }

  const handleSplit = async () => {
    if (!file || totalPages === 0 || isProcessing) return;
    setIsProcessing(true);
    setErrorMessage(null);
    setStatus('Validating page range...');

    const parsed = parsePageRange(rangeInput, totalPages);
    if (parsed.error) {
      setErrorMessage(parsed.error);
      setIsProcessing(false);
      return;
    }

    try {
      const bytes = await file.arrayBuffer();
      const srcDoc = await PDFDocument.load(bytes);
      const targetZeroIndices = parsed.pages.map(p => p - 1);

      if (splitMode === 'single') {
        setStatus(`Extracting ${parsed.pages.length} pages into single PDF...`);
        setProgress(40);

        const outDoc = await PDFDocument.create();
        const copied = await outDoc.copyPages(srcDoc, targetZeroIndices);
        copied.forEach(p => outDoc.addPage(p));

        const outBytes = await outDoc.save();
        const blob = new Blob([outBytes as any], { type: 'application/pdf' });
        downloadBlob(blob, outputFileName || 'split.pdf');

        setStatus(`Extracted ${parsed.pages.length} pages to ${outputFileName} (${formatBytes(blob.size)})`);
        setProgress(100);
      } else {
        // Zip mode: one PDF per extracted page
        setStatus(`Extracting ${parsed.pages.length} pages as individual PDFs...`);
        const zipMap: Record<string, Uint8Array> = {};

        for (let i = 0; i < parsed.pages.length; i++) {
          const pageNum = parsed.pages[i];
          const singleDoc = await PDFDocument.create();
          const [copiedPage] = await singleDoc.copyPages(srcDoc, [pageNum - 1]);
          singleDoc.addPage(copiedPage);
          const singleBytes = await singleDoc.save();
          zipMap[`page-${String(pageNum).padStart(3, '0')}.pdf`] = singleBytes;
          setProgress(Math.round(((i + 1) / parsed.pages.length) * 90));
        }

        setStatus('Creating ZIP archive...');
        await downloadZip(zipMap, file.name.replace(/\.pdf$/i, '') + '-pages.zip');
        setStatus(`Downloaded ZIP containing ${parsed.pages.length} individual page PDFs`);
        setProgress(100);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Error occurred while splitting PDF');
      setStatus('Splitting failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ToolLayout
      title="Split / Extract PDF"
      description="Extract specific page ranges or burst all pages into separate PDF documents in a zip archive."
      howItWorks="Loads the PDF into an isolated memory buffer and copies only the selected page objects into fresh PDF containers using pdf-lib. Multiple pages can be packaged into a zip file using fflate."
      faq="Encrypted or locked PDFs must have password protection removed first before extraction."
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
            title={file ? file.name : 'Select PDF to split'}
            subtitle={file ? `${totalPages} pages · ${formatBytes(file.size)}` : 'Single PDF document up to 50MB'}
          />

          {file && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                Total: {totalPages} pages
              </span>
              <button
                onClick={() => { setFile(null); setTotalPages(0); }}
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
                  <line x1="4" y1="12" x2="20" y2="12"></line>
                </svg>
              </span>
              split configuration
            </span>
            <span className="handwritten-hint">(ranges &amp; mode)</span>
          </div>

          <div className="control-grid">
            <div className="control-field" style={{ gridColumn: '1 / -1' }}>
              <label className="control-label">page range (e.g. 1-3, 5, 8)</label>
              <input
                type="text"
                className="craft-input"
                value={rangeInput}
                onChange={e => setRangeInput(e.target.value)}
                placeholder="1-3, 5"
                disabled={!file}
              />
            </div>

            <div className="control-field" style={{ gridColumn: '1 / -1' }}>
              <label className="control-label">extraction mode</label>
              <select
                className="craft-select"
                value={splitMode}
                onChange={e => setSplitMode(e.target.value as any)}
                disabled={!file}
              >
                <option value="single">Merge extracted pages into one PDF</option>
                <option value="zip">Extract each page as separate PDF in a ZIP</option>
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
              output &amp; stats
            </span>
            <span className="handwritten-hint">(split status)</span>
          </div>

          <div className="stats-row">
            <div className="stat-item">
              <span className="stat-label">file</span>
              <span className="stat-value">{file ? '1 PDF' : 'None'}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">pages</span>
              <span className="stat-value">{totalPages}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">tool</span>
              <span className="stat-value">split-pdf</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">format</span>
              <span className="stat-value">{splitMode === 'single' ? 'PDF' : 'ZIP'}</span>
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
            {splitMode === 'single' && (
              <div style={{ flex: 1, minWidth: '200px' }}>
                <input
                  type="text"
                  className="craft-input"
                  value={outputFileName}
                  onChange={e => setOutputFileName(e.target.value)}
                  placeholder="split.pdf"
                />
              </div>
            )}
            <button
              onClick={handleSplit}
              disabled={!file || isProcessing}
              className="btn-primary-mint"
              style={{ flex: splitMode === 'zip' ? 1 : undefined }}
            >
              <span>{splitMode === 'single' ? 'extract to pdf' : 'download zip'}</span>
              <span>→</span>
            </button>
          </div>
        </>
      }
    />
  );
};
