import React, { useState } from 'react';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { ToolLayout } from '../components/ToolLayout';
import { Dropzone } from '../components/Dropzone';
import { formatBytes, validateFileSize, downloadBlob } from '../utils/file';

export const TextToPdfTool: React.FC = () => {
  const [text, setText] = useState<string>('Type your content here, or upload a .txt / .md document...');
  const [fontSize, setFontSize] = useState<number>(11);
  const [lineSpacing, setLineSpacing] = useState<number>(1.4);
  const [pageSize, setPageSize] = useState<'a4' | 'letter'>('a4');
  const [outputFileName, setOutputFileName] = useState<string>('document.pdf');

  const [status, setStatus] = useState<string>('Ready to compile text into PDF');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileSelected = (selectedFiles: FileList | File[]) => {
    setErrorMessage(null);
    const chosen = selectedFiles[0];
    if (!chosen) return;

    const sizeCheck = validateFileSize(chosen, 10);
    if (!sizeCheck.valid) {
      setErrorMessage(sizeCheck.error || 'File too large');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setText(reader.result as string);
      setOutputFileName(chosen.name.replace(/\.[^/.]+$/, '') + '.pdf');
      setStatus(`Loaded "${chosen.name}" (${formatBytes(chosen.size)})`);
    };
    reader.readAsText(chosen);
  };

  const PAGE_DIMS: Record<string, [number, number]> = {
    a4: [595.28, 841.89],
    letter: [612, 792]
  };

  const handleCompile = async () => {
    if (!text.trim() || isProcessing) return;
    setIsProcessing(true);
    setErrorMessage(null);
    setStatus('Typesetting PDF pages with pdf-lib...');

    try {
      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

      const [pageW, pageH] = PAGE_DIMS[pageSize];
      const margin = 48; // 48 pt margin
      const contentW = pageW - margin * 2;
      const contentH = pageH - margin * 2;
      const lineHeight = fontSize * lineSpacing;

      // Word wrapping helper
      const paragraphs = text.split('\n');
      const wrappedLines: string[] = [];

      for (const para of paragraphs) {
        if (!para.trim()) {
          wrappedLines.push('');
          continue;
        }

        const words = para.split(' ');
        let curLine = '';

        for (const word of words) {
          const testLine = curLine ? `${curLine} ${word}` : word;
          const testWidth = font.widthOfTextAtSize(testLine, fontSize);

          if (testWidth <= contentW) {
            curLine = testLine;
          } else {
            if (curLine) wrappedLines.push(curLine);
            curLine = word;
          }
        }
        if (curLine) wrappedLines.push(curLine);
      }

      // Distribute lines across pages
      const linesPerPage = Math.floor(contentH / lineHeight);
      let page = pdfDoc.addPage([pageW, pageH]);
      let currentLineInPage = 0;

      for (let i = 0; i < wrappedLines.length; i++) {
        if (currentLineInPage >= linesPerPage) {
          page = pdfDoc.addPage([pageW, pageH]);
          currentLineInPage = 0;
        }

        const line = wrappedLines[i];
        if (line) {
          const yPos = pageH - margin - (currentLineInPage + 1) * lineHeight;
          page.drawText(line, {
            x: margin,
            y: yPos,
            size: fontSize,
            font,
            color: rgb(0.1, 0.1, 0.12)
          });
        }
        currentLineInPage++;
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      downloadBlob(blob, outputFileName || 'document.pdf');

      setStatus(`Compiled ${pdfDoc.getPageCount()} pages (${formatBytes(blob.size)})`);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Text to PDF compilation failed');
      setStatus('Compilation failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ToolLayout
      title="Text to PDF"
      description="Convert plain text, markdown, or uploaded text files into formatted, printable PDF documents."
      howItWorks="Performs vector typesetting with word-wrapping and pagination calculation using standard Helvetica font metrics via pdf-lib in browser memory."
      faq="Generates crisp vector text. Never compressed into blurry pixels."
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
              upload text file
            </span>
            <span className="handwritten-hint">(or edit below)</span>
          </div>

          <Dropzone
            accept=".txt,.md,text/plain,text/markdown"
            multiple={false}
            onFilesSelected={handleFileSelected}
            title="Upload .txt or .md file"
            subtitle="Or type directly in the editor below"
          />
        </>
      }
      indigoCardContent={
        <>
          <div className="card-topline">
            <span className="card-tag">
              <span className="glyph-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 7V4h16v3"></path>
                  <path d="M9 20h6"></path>
                  <path d="M12 4v16"></path>
                </svg>
              </span>
              typography options
            </span>
            <span className="handwritten-hint">(font &amp; margins)</span>
          </div>

          <div className="control-grid">
            <div className="control-field">
              <label className="control-label">page size</label>
              <select className="craft-select" value={pageSize} onChange={e => setPageSize(e.target.value as any)}>
                <option value="a4">A4 (210 × 297 mm)</option>
                <option value="letter">Letter (8.5 × 11 in)</option>
              </select>
            </div>

            <div className="control-field">
              <label className="control-label">font size ({fontSize} pt)</label>
              <select className="craft-select" value={fontSize} onChange={e => setFontSize(Number(e.target.value))}>
                <option value="9">9 pt (Small / Dense)</option>
                <option value="11">11 pt (Standard Document)</option>
                <option value="13">13 pt (Large)</option>
                <option value="16">16 pt (Reading / Large)</option>
              </select>
            </div>

            <div className="control-field">
              <label className="control-label">line spacing</label>
              <select className="craft-select" value={lineSpacing} onChange={e => setLineSpacing(Number(e.target.value))}>
                <option value="1.2">Compact (1.2x)</option>
                <option value="1.4">Standard (1.4x)</option>
                <option value="1.8">Spacious (1.8x)</option>
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
            <span className="handwritten-hint">(ready to compile)</span>
          </div>

          <div className="stats-row">
            <div className="stat-item">
              <span className="stat-label">characters</span>
              <span className="stat-value">{text.length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">words</span>
              <span className="stat-value">{text.trim() ? text.trim().split(/\s+/).length : 0}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">format</span>
              <span className="stat-value">{pageSize.toUpperCase()}</span>
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
                placeholder="document.pdf"
              />
            </div>
            <button
              onClick={handleCompile}
              disabled={!text.trim() || isProcessing}
              className="btn-primary-mint"
            >
              <span>compile text to pdf</span>
              <span>→</span>
            </button>
          </div>
        </>
      }
      fileSequenceContent={
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600 }}>Document Text Editor</span>
          <textarea
            className="craft-textarea"
            style={{ minHeight: '260px', fontFamily: 'var(--font-mono)', lineHeight: 1.6 }}
            value={text}
            onChange={e => setText(e.target.value)}
          />
        </div>
      }
    />
  );
};
