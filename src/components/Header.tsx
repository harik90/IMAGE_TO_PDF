import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { toolsRegistry } from '../tools/registry';

interface Props {
  onOpenSearch: () => void;
}

export const Header: React.FC<Props> = ({ onOpenSearch }) => {
  const location = useLocation();
  const currentTool = toolsRegistry.find(t => t.route === location.pathname);

  return (
    <header className="app-header">
      <div className="header-inner">
        <Link to="/" className="header-brand">
          <span className="root-name">~/shapedinto</span>
          <span className="sep">/</span>
          <span className="tool-name">
            {currentTool ? currentTool.id : 'home'}
          </span>
        </Link>

        <div className="header-actions">
          <button
            onClick={onOpenSearch}
            className="pill-btn"
            aria-label="Search tools"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <span>search</span>
            <kbd>⌘K</kbd>
          </button>

          <Link to="/" className={`pill-btn ${location.pathname === '/' ? 'active' : ''}`}>
            <span>all tools</span>
          </Link>

          <div className="privacy-badge" style={{ padding: '4px 10px', fontSize: '10px' }}>
            <span className="pulse-dot"></span>
            <span>100% client-side</span>
          </div>
        </div>
      </div>
    </header>
  );
};
