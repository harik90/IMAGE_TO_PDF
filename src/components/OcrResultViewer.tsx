import React, { useState, useRef, useEffect } from 'react';
import { OcrResultWord } from '../utils/tesseract';
import { downloadBlob } from '../utils/file';
import { Copy, Check, Download, AlertTriangle, Eye, FileText, SplitSquareVertical } from 'lucide-react';

interface Props {
  text: string;
  markdown: string;
  confidence: number;
  words?: OcrResultWord[];
  originalImageUrl?: string;
  processedImageUrl?: string;
  fileName?: string;
  onTextChange?: (newText: string) => void;
  onMarkdownChange?: (newMd: string) => void;
}

export const OcrResultViewer: React.FC<Props> = ({
  text,
  markdown,
  confidence,
  words = [],
  originalImageUrl,
  processedImageUrl,
  fileName = 'extracted-content',
  onTextChange,
  onMarkdownChange
}) => {
  const [activeTab, setActiveTab] = useState<'markdown' | 'text' | 'side-by-side'>('markdown');
  const [showPreprocessed, setShowPreprocessed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [localText, setLocalText] = useState(text);
  const [localMarkdown, setLocalMarkdown] = useState(markdown);

  const leftScrollRef = useRef<HTMLDivElement>(null);
  const rightScrollRef = useRef<HTMLDivElement>(null);
  const isSyncingLeft = useRef(false);
  const isSyncingRight = useRef(false);

  useEffect(() => {
    setLocalText(text);
  }, [text]);

  useEffect(() => {
    setLocalMarkdown(markdown);
  }, [markdown]);

  // Synchronized scrolling in side-by-side mode
  const handleLeftScroll = () => {
    if (isSyncingRight.current) return;
    const left = leftScrollRef.current;
    const right = rightScrollRef.current;
    if (!left || !right) return;

    isSyncingLeft.current = true;
    const scrollPercentage = left.scrollTop / (left.scrollHeight - left.clientHeight || 1);
    right.scrollTop = scrollPercentage * (right.scrollHeight - right.clientHeight);
    requestAnimationFrame(() => {
      isSyncingLeft.current = false;
    });
  };

  const handleRightScroll = () => {
    if (isSyncingLeft.current) return;
    const left = leftScrollRef.current;
    const right = rightScrollRef.current;
    if (!left || !right) return;

    isSyncingRight.current = true;
    const scrollPercentage = right.scrollTop / (right.scrollHeight - right.clientHeight || 1);
    left.scrollTop = scrollPercentage * (left.scrollHeight - left.clientHeight);
    requestAnimationFrame(() => {
      isSyncingRight.current = false;
    });
  };

  const handleCopy = () => {
    const content = activeTab === 'markdown' ? localMarkdown : localText;
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMd = () => {
    const baseName = fileName.replace(/\.[^/.]+$/, '');
    const blob = new Blob([localMarkdown], { type: 'text/markdown;charset=utf-8' });
    downloadBlob(blob, `${baseName}.md`);
  };

  const handleDownloadTxt = () => {
    const baseName = fileName.replace(/\.[^/.]+$/, '');
    const blob = new Blob([localText], { type: 'text/plain;charset=utf-8' });
    downloadBlob(blob, `${baseName}.txt`);
  };

  const isLowConfidence = confidence > 0 && confidence < 60;
  const currentImageUrl = showPreprocessed && processedImageUrl ? processedImageUrl : originalImageUrl;

  return (
    <div className="ocr-viewer-card">
      {/* Top Bar: Tabs & Action Buttons */}
      <div className="ocr-viewer-header">
        <div className="ocr-tabs-group" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'markdown'}
            className={`ocr-tab-btn ${activeTab === 'markdown' ? 'active' : ''}`}
            onClick={() => setActiveTab('markdown')}
          >
            <FileText size={14} />
            <span>Markdown</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'text'}
            className={`ocr-tab-btn ${activeTab === 'text' ? 'active' : ''}`}
            onClick={() => setActiveTab('text')}
          >
            <span>Plain text</span>
          </button>

          {originalImageUrl && (
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'side-by-side'}
              className={`ocr-tab-btn ${activeTab === 'side-by-side' ? 'active' : ''}`}
              onClick={() => setActiveTab('side-by-side')}
            >
              <SplitSquareVertical size={14} />
              <span>Side by side</span>
            </button>
          )}
        </div>

        <div className="ocr-actions-group">
          {confidence > 0 && (
            <span
              className={`confidence-metric-pill ${confidence < 60 ? 'low' : confidence < 80 ? 'mid' : 'high'}`}
              title="Average recognition confidence score"
            >
              OCR: {confidence}%
            </span>
          )}

          <button type="button" onClick={handleCopy} className="btn-secondary-compact" aria-label="Copy to clipboard">
            {copied ? <Check size={13} className="text-mint" /> : <Copy size={13} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button type="button" onClick={handleDownloadMd} className="btn-secondary-compact" aria-label="Download Markdown">
            <Download size={13} />
            <span>.md</span>
          </button>

          <button type="button" onClick={handleDownloadTxt} className="btn-secondary-compact" aria-label="Download Plain Text">
            <Download size={13} />
            <span>.txt</span>
          </button>
        </div>
      </div>

      {/* Handwriting Honesty Banner */}
      {isLowConfidence && (
        <div className="ocr-honesty-banner" role="alert">
          <AlertTriangle size={15} className="warning-icon" />
          <span>
            Handwriting recognition accuracy is limited in client-side Tesseract. Best results with printed text.
          </span>
        </div>
      )}

      {/* Preprocessing Image Toggle Switch (when preview image is available) */}
      {processedImageUrl && originalImageUrl && (
        <div className="ocr-preview-toggle-bar">
          <label className="toggle-label-inline">
            <input
              type="checkbox"
              checked={showPreprocessed}
              onChange={e => setShowPreprocessed(e.target.checked)}
              className="toggle-checkbox"
            />
            <Eye size={13} />
            <span>Show preprocessed image (300 DPI Otsu binarized)</span>
          </label>
        </div>
      )}

      {/* Tab Panels */}
      <div className="ocr-content-body">
        {/* 1. Markdown Tab */}
        {activeTab === 'markdown' && (
          <div className="ocr-editor-pane">
            <textarea
              className="ocr-textarea"
              value={localMarkdown}
              onChange={e => {
                setLocalMarkdown(e.target.value);
                onMarkdownChange?.(e.target.value);
              }}
              placeholder="Extracted Markdown content..."
              spellCheck={false}
            />
          </div>
        )}

        {/* 2. Plain Text Tab */}
        {activeTab === 'text' && (
          <div className="ocr-editor-pane">
            <textarea
              className="ocr-textarea"
              value={localText}
              onChange={e => {
                setLocalText(e.target.value);
                onTextChange?.(e.target.value);
              }}
              placeholder="Extracted plain text content..."
              spellCheck={false}
            />
          </div>
        )}

        {/* 3. Side by Side View */}
        {activeTab === 'side-by-side' && currentImageUrl && (
          <div className="ocr-side-by-side-grid">
            {/* Left: Original / Preprocessed Image */}
            <div
              className="ocr-split-pane image-pane"
              ref={leftScrollRef}
              onScroll={handleLeftScroll}
            >
              <div className="pane-sticky-header">
                <span>{showPreprocessed ? 'Cleaned Binary Preview (300 DPI)' : 'Source Document Page'}</span>
              </div>
              <div className="split-image-container">
                <img
                  src={currentImageUrl}
                  alt="Source document"
                  className="split-preview-img"
                />
              </div>
            </div>

            {/* Right: Extracted text with synchronized scroll & confidence highlighting */}
            <div
              className="ocr-split-pane text-pane"
              ref={rightScrollRef}
              onScroll={handleRightScroll}
            >
              <div className="pane-sticky-header">
                <span>Recognized Output</span>
                {words.length > 0 && (
                  <span className="words-meta-hint">
                    Words with confidence &lt;60% are highlighted
                  </span>
                )}
              </div>

              {words.length > 0 ? (
                <div className="ocr-words-stream">
                  {words.map((w, i) => {
                    const isLow = w.confidence > 0 && w.confidence < 60;
                    return (
                      <span
                        key={i}
                        className={`ocr-word ${isLow ? 'low-confidence-word' : ''}`}
                        title={`Confidence: ${Math.round(w.confidence)}%`}
                      >
                        {w.text}{' '}
                      </span>
                    );
                  })}
                </div>
              ) : (
                <textarea
                  className="ocr-textarea-split"
                  value={localMarkdown || localText}
                  onChange={e => {
                    setLocalMarkdown(e.target.value);
                    setLocalText(e.target.value);
                  }}
                  spellCheck={false}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
