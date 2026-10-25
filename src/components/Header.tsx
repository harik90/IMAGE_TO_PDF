import React, { useState, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { toolsRegistry } from '../tools/registry';
import { Search, ChevronDown, Sparkles } from 'lucide-react';
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
        {/* Left: Brand / Breadcrumb */}
        <Link to="/" className="header-brand" aria-label="image_to_pdf home">
          <div className="header-logo-mark">
            <Sparkles size={14} className="logo-spark" />
          </div>
          <span className="brand-wordmark">image_to_pdf</span>
          {currentTool && (
            <>
              <span className="breadcrumb-sep">/</span>
              <span className="breadcrumb-tool" title={currentTool.name}>
                {currentTool.name}
              </span>
            </>
          )}
        </Link>

        {/* Right: Nav Actions */}
        <nav className="header-nav-actions" aria-label="Main navigation">
          {/* 1. Tools */}
          <Link
            to="/"
            className={`nav-text-link ${location.pathname === '/' ? 'active' : ''}`}
          >
            Tools
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
            <span>More</span>
            <ChevronDown size={14} className={`chevron-icon ${isMoreOpen ? 'open' : ''}`} />
          </button>

          {/* 3. Search */}
          <button
            type="button"
            onClick={onOpenSearch}
            className="header-search-btn"
            aria-label="Search tools (Command K)"
          >
            <Search size={14} />
            <span className="search-btn-label">Search</span>
            <kbd className="search-shortcut">⌘K</kbd>
          </button>

          {/* 4. GitHub Star Button */}
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
