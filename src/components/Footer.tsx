import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="app-footer">
      <div className="footer-inner">
        <div className="footer-mono-meta">
          <span className="live-status-dot" aria-hidden="true"></span>
          <span>image_to_pdf</span>
          <span className="footer-sep">·</span>
          <span>100% browser memory</span>
          <span className="footer-sep">·</span>
          <span>zero server telemetry</span>
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
          <span className="footer-sep">·</span>
          <a
            href="https://github.com/harik90/IMAGE_TO_PDF/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-craft-link"
          >
            report issue ↗
          </a>
          <span className="footer-sep">·</span>
          <Link to="/" className="footer-craft-link">
            all tools
          </Link>
        </div>
      </div>
    </footer>
  );
};
