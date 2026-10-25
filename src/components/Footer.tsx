import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="app-footer">
      <div className="footer-inner">
        <div>
          <span>shapedinto · 100% private client-side utilities.</span>
          <span style={{ marginLeft: '8px', color: 'var(--mint-primary)' }}>No signup. No limits. Free.</span>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <Link to="/" style={{ textDecoration: 'underline dotted', color: 'var(--text-secondary)' }}>all tools ↗</Link>
          <span style={{ color: 'var(--text-muted)' }}>zero network telemetry</span>
        </div>
      </div>
    </footer>
  );
};
