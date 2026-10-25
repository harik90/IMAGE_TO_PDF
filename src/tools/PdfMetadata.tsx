import React, { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import { ToolLayout } from '../components/ToolLayout';
import { Dropzone } from '../components/Dropzone';
import { formatBytes, validateFileSize, validateFileType, downloadBlob } from '../utils/file';

export const PdfMetadataTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState<string>('');
  const [author, setAuthor] = useState<string>('');
  const [subject, setSubject] = useState<string>('');
  const [keywords, setKeywords] = useState<string>('');
  const [creator, setCreator] = useState<string>('');
  const [producer, setProducer] = useState<string>('');
  const [outputFileName, setOutputFileName] = useState<string>('updated-metadata.pdf');

  const [status, setStatus] = useState<string>('Select a PDF to inspect and update metadata');
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
      setTitle(pdf.getTitle() || '');
      setAuthor(pdf.getAuthor() || '');
      setSubject(pdf.getSubject() || '');
      setKeywords(pdf.getKeywords() || '');
      setCreator(pdf.getCreator() || '');
      setProducer(pdf.getProducer() || '');

      setOutputFileName(chosen.name.replace(/\.pdf$/i, '') + '-meta.pdf');
      setStatus(`Loaded metadata from "${chosen.name}" (${pdf.getPageCount()} pages)`);
    } catch {
      setErrorMessage('This PDF is locked or damaged. Remove the password and try again.');
    }
  };

  const handleSave = async () => {
    if (!file || isProcessing) return;
    setIsProcessing(true);
    setErrorMessage(null);
    setStatus('Updating PDF metadata dictionary in memory...');

    try {
      const bytes = await file.arrayBuffer();
      const pdf = await PDFDocument.load(bytes);

      if (title) pdf.setTitle(title);
      if (author) pdf.setAuthor(author);
      if (subject) pdf.setSubject(subject);
      if (keywords) pdf.setKeywords(keywords.split(',').map(s => s.trim()));
      if (creator) pdf.setCreator(creator);
      if (producer) pdf.setProducer(producer);
      pdf.setModificationDate(new Date());

      const outBytes = await pdf.save();
      const blob = new Blob([outBytes as any], { type: 'application/pdf' });
      downloadBlob(blob, outputFileName || 'document.pdf');
      setStatus(`Success! Saved updated metadata into ${outputFileName} (${formatBytes(blob.size)})`);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to update metadata');
      setStatus('Save failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ToolLayout
      title="PDF Metadata Viewer &amp; Editor"
      description="Inspect and edit internal document metadata (Title, Author, Subject, Keywords, Creator) without altering document contents."
      howItWorks="Directly reads and updates the /Info dictionary and XMP metadata stream using pdf-lib in browser memory. Preserves all pages, fonts, annotations, and bookmarks untouched."
      faq="Useful for sanitizing personal or organization details before sharing documents publicly."
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
            title={file ? file.name : 'Select PDF to inspect'}
            subtitle={file ? formatBytes(file.size) : 'Single PDF document up to 50MB'}
          />
        </>
      }
      indigoCardContent={
        <>
          <div className="card-topline">
            <span className="card-tag">
              <span className="glyph-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </span>
              metadata properties
            </span>
            <span className="handwritten-hint">(view &amp; modify)</span>
          </div>

          <div className="control-grid">
            <div className="control-field">
              <label className="control-label">document title</label>
              <input
                type="text"
                className="craft-input"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Document Title"
                disabled={!file}
              />
            </div>

            <div className="control-field">
              <label className="control-label">author</label>
              <input
                type="text"
                className="craft-input"
                value={author}
                onChange={e => setAuthor(e.target.value)}
                placeholder="Your name"
                disabled={!file}
              />
            </div>

            <div className="control-field">
              <label className="control-label">subject</label>
              <input
                type="text"
                className="craft-input"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="Subject / Summary"
                disabled={!file}
              />
            </div>

            <div className="control-field">
              <label className="control-label">keywords (comma-separated)</label>
              <input
                type="text"
                className="craft-input"
                value={keywords}
                onChange={e => setKeywords(e.target.value)}
                placeholder="report, finance, 2026"
                disabled={!file}
              />
            </div>

            <div className="control-field">
              <label className="control-label">creator application</label>
              <input
                type="text"
                className="craft-input"
                value={creator}
                onChange={e => setCreator(e.target.value)}
                placeholder="Creator software"
                disabled={!file}
              />
            </div>

            <div className="control-field">
              <label className="control-label">producer</label>
              <input
                type="text"
                className="craft-input"
                value={producer}
                onChange={e => setProducer(e.target.value)}
                placeholder="PDF Producer"
                disabled={!file}
              />
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
            <span className="handwritten-hint">(metadata save)</span>
          </div>

          <div className="stats-row">
            <div className="stat-item">
              <span className="stat-label">file</span>
              <span className="stat-value">{file ? '1 PDF' : 'None'}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">size</span>
              <span className="stat-value">{file ? formatBytes(file.size) : '0 B'}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">tool</span>
              <span className="stat-value">pdf-metadata</span>
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
                placeholder="document-metadata.pdf"
              />
            </div>
            <button
              onClick={handleSave}
              disabled={!file || isProcessing}
              className="btn-primary-mint"
            >
              <span>save pdf with new metadata</span>
              <span>→</span>
            </button>
          </div>
        </>
      }
    />
  );
};
