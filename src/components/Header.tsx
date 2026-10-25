import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { toolsRegistry } from '../tools/registry';
import { Search } from 'lucide-react';
import { GitHubStarButton } from './GitHubStarButton';
import { ThemeToggle } from './ThemeToggle';

interface Props {
  onOpenSearch: () => void;
}

export const Header: React.FC<Props> = ({ onOpenSearch }) => {
  const location = useLocation();
  const currentTool = toolsRegistry.find(t => t.route === location.pathname);

  return (
    <header className="app-header">
      <div className="header-inner">
        {/* Left: Breadcrumb path in technical mono */}
        <Link to="/" className="header-brand-mono" aria-label="image_to_pdf home">
          <span className="mono-path-tilde">~/</span>
          <span className="mono-path-root">image_to_pdf</span>
          {currentTool && (
            <>
              <span className="mono-sep">/</span>
              <span className="mono-path-tool" title={currentTool.name}>
                {currentTool.id}
              </span>
            </>
          )}
        </Link>

        {/* Right: Actions */}
        <nav className="header-nav-actions" aria-label="Main navigation">
          {/* 1. Tools anchor */}
          <Link
            to="/"
            className={`nav-text-link ${location.pathname === '/' ? 'active' : ''}`}
          >
            tools
          </Link>

          {/* 2. Search */}
          <button
            type="button"
            onClick={onOpenSearch}
            className="header-search-btn"
            aria-label="Search tools (Command K)"
          >
            <Search size={13} strokeWidth={1.75} />
            <span className="search-btn-label">search</span>
            <kbd className="search-shortcut">⌘K</kbd>
          </button>

          {/* 3. Live GitHub Star Button */}
          <GitHubStarButton />

          {/* 4. Theme Toggle */}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
};
