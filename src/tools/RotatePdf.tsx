import React, { useState } from 'react';
import { PDFDocument, degrees } from 'pdf-lib';
import { ToolLayout } from '../components/ToolLayout';
import { Dropzone } from '../components/Dropzone';
import { formatBytes, validateFileSize, validateFileType, downloadBlob } from '../utils/file';

export const RotatePdfTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [rotationAngle, setRotationAngle] = useState<number>(90);
  const [targetPages, setTargetPages] = useState<'all' | 'even' | 'odd'>('all');
  const [outputFileName, setOutputFileName] = useState<string>('rotated.pdf');

  const [status, setStatus] = useState<string>('Select a PDF to rotate pages');
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
      const bytes = await chosen.arrayBuffer();
      const pdf = await PDFDocument.load(bytes);
      setFile(chosen);
      setTotalPages(pdf.getPageCount());
      setOutputFileName(chosen.name.replace(/\.pdf$/i, '') + '-rotated.pdf');
      setStatus(`Loaded "${chosen.name}" (${pdf.getPageCount()} pages)`);
    } catch {
      setErrorMessage('This PDF is locked or damaged. Remove the password and try again.');
    }
  };

  const handleRotate = async () => {
    if (!file || isProcessing) return;
    setIsProcessing(true);
    setErrorMessage(null);
    setStatus('Rotating PDF pages in memory...');

    try {
      const bytes = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(bytes);
      const pages = pdfDoc.getPages();

      pages.forEach((page, idx) => {
        const pageNum = idx + 1;
        let shouldRotate = false;
        if (targetPages === 'all') shouldRotate = true;
        else if (targetPages === 'odd' && pageNum % 2 !== 0) shouldRotate = true;
        else if (targetPages === 'even' && pageNum % 2 === 0) shouldRotate = true;

        if (shouldRotate) {
          const currentRotation = page.getRotation().angle;
          page.setRotation(degrees((currentRotation + rotationAngle) % 360));
        }
      });

      const rotatedBytes = await pdfDoc.save();
      const blob = new Blob([rotatedBytes as any], { type: 'application/pdf' });
      downloadBlob(blob, outputFileName || 'rotated.pdf');
      setStatus(`Success! Rotated ${pages.length} pages by ${rotationAngle}°`);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to rotate PDF');
      setStatus('Rotation failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ToolLayout
      title="Rotate PDF"
      description="Rotate all or selected pages of your PDF document permanently by 90, 180, or 270 degrees."
      howItWorks="Updates the intrinsic /Rotate attribute of the PDF page dictionary using pdf-lib without re-compressing or degrading original vectors and text."
      faq="Completely lossless. Text and vectors remain pin-sharp."
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
            title={file ? file.name : 'Select PDF to rotate'}
            subtitle={file ? `${totalPages} pages · ${formatBytes(file.size)}` : 'Single PDF document up to 50MB'}
          />
        </>
      }
      indigoCardContent={
        <>
          <div className="card-topline">
            <span className="card-tag">
              <span className="glyph-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 4 23 10 17 10"></polyline>
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                </svg>
              </span>
              rotation settings
            </span>
            <span className="handwritten-hint">(angle &amp; pages)</span>
          </div>

          <div className="control-grid">
            <div className="control-field">
              <label className="control-label">rotation angle</label>
              <select className="craft-select" value={rotationAngle} onChange={e => setRotationAngle(Number(e.target.value))}>
                <option value="90">90° Clockwise</option>
                <option value="180">180° Flip</option>
                <option value="270">270° Counter-Clockwise</option>
              </select>
            </div>

            <div className="control-field">
              <label className="control-label">apply to</label>
              <select className="craft-select" value={targetPages} onChange={e => setTargetPages(e.target.value as any)}>
                <option value="all">All Pages</option>
                <option value="odd">Odd Pages Only (1, 3, 5...)</option>
                <option value="even">Even Pages Only (2, 4, 6...)</option>
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
            <span className="handwritten-hint">(save rotated)</span>
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
              <span className="stat-label">angle</span>
              <span className="stat-value">{rotationAngle}°</span>
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
                placeholder="rotated.pdf"
              />
            </div>
            <button
              onClick={handleRotate}
              disabled={!file || isProcessing}
              className="btn-primary-mint"
            >
              <span>save rotated pdf</span>
              <span>→</span>
            </button>
          </div>
        </>
      }
    />
  );
};
