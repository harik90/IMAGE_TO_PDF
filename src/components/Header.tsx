import React, { useState, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { toolsRegistry } from '../tools/registry';
import { Search, ChevronDown } from 'lucide-react';
import { MoreMenu } from './MoreMenu';
import { GitHubStarButton } from './GitHubStarButton';
import { ThemeToggle } from './ThemeToggle';

interface Props {
  onOpenSearch: () => void;
}

export const Header: React.FC<Props> = ({ onOpenSearch }) => {
  const location = useLocation();
  const currentTool = toolsRegistry.find(t => t.route === location.pathname);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const moreTriggerRef = useRef<HTMLButtonElement>(null);

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

          {/* 2. More ▾ */}
          <button
            ref={moreTriggerRef}
            type="button"
            className={`nav-more-btn ${isMoreOpen ? 'active' : ''}`}
            onClick={() => setIsMoreOpen(prev => !prev)}
            aria-expanded={isMoreOpen}
            aria-label="More tools menu"
          >
            <span>more</span>
            <ChevronDown size={13} className={`chevron-icon ${isMoreOpen ? 'open' : ''}`} />
          </button>

          {/* 3. Search */}
          <button
            type="button"
            onClick={onOpenSearch}
            className="header-search-btn"
            aria-label="Search tools (Command K)"
          >
            <Search size={13} />
            <span className="search-btn-label">search</span>
            <kbd className="search-shortcut">⌘K</kbd>
          </button>

          {/* 4. Live GitHub Star Button */}
          <GitHubStarButton />

          {/* 5. Theme Toggle */}
          <ThemeToggle />
        </nav>
      </div>

      <MoreMenu
        isOpen={isMoreOpen}
        onClose={() => setIsMoreOpen(false)}
        triggerRef={moreTriggerRef}
      />
    </header>
  );
};
