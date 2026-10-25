import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="app-footer">
      <div className="footer-inner">
        <div className="footer-mono-meta">
          <div className="footer-meta-brand">
            <span className="live-status-dot" aria-hidden="true"></span>
            <span className="footer-meta-title">image_to_pdf</span>
          </div>
          <span className="footer-sep" aria-hidden="true">·</span>
          <span className="footer-meta-item">
            <span className="footer-sub-prefix" aria-hidden="true">↳</span>
            <span>100% browser memory</span>
          </span>
          <span className="footer-sep" aria-hidden="true">·</span>
          <span className="footer-meta-item">
            <span className="footer-sub-prefix" aria-hidden="true">↳</span>
            <span>zero server telemetry</span>
          </span>
        </div>

        <div className="footer-links-row">
          <a
            href="https://github.com/harik90/IMAGE_TO_PDF"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-craft-link"
          >
            source ↗
          </a>
          <span className="footer-sep" aria-hidden="true">·</span>
          <a
            href="https://github.com/harik90/IMAGE_TO_PDF/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-craft-link"
          >
            report issue ↗
          </a>
          <span className="footer-sep" aria-hidden="true">·</span>
          <Link to="/" className="footer-craft-link">
            all tools
          </Link>
        </div>
      </div>
    </footer>
  );
};
