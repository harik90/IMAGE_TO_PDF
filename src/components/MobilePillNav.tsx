import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Layers, Search, Moon, Sun } from 'lucide-react';
import { useTheme } from '../utils/theme';
import { useGitHubStars, formatStarCount } from '../utils/github';

interface Props {
  onOpenSearch: () => void;
}

export const MobilePillNav: React.FC<Props> = ({ onOpenSearch }) => {
  const location = useLocation();
  const { resolvedTheme, setTheme } = useTheme();
  const { stars, repoUrl } = useGitHubStars({ owner: 'harik90', repo: 'IMAGE_TO_PDF' });

  const isHome = location.pathname === '/';
  const isTools = location.pathname !== '/';

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  const starCountFormatted = stars !== null ? formatStarCount(stars) : '2';

  return (
    <nav className="mobile-pill-nav" aria-label="Mobile navigation">
      {/* 1. Home */}
      <Link
        to="/"
        className={`mobile-pill-btn ${isHome ? 'active' : ''}`}
        aria-label="Home"
      >
        <span className="mobile-glyph-wrap">
          <Home size={15} strokeWidth={1.5} />
        </span>
        <span className="mobile-pill-label">home</span>
      </Link>

      {/* 2. Tools */}
      <Link
        to="/image-to-pdf"
        className={`mobile-pill-btn ${isTools ? 'active' : ''}`}
        aria-label="Tools"
      >
        <span className="mobile-glyph-wrap">
          <Layers size={15} strokeWidth={1.5} />
        </span>
        <span className="mobile-pill-label">tools</span>
      </Link>

      {/* 3. Search */}
      <button
        type="button"
        onClick={onOpenSearch}
        className="mobile-pill-btn"
        aria-label="Search tools"
      >
        <span className="mobile-glyph-wrap">
          <Search size={15} strokeWidth={1.5} />
        </span>
        <span className="mobile-pill-label">search</span>
      </button>

      {/* 4. GitHub Star */}
      <a
        href={repoUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mobile-pill-btn"
        aria-label="GitHub repository"
      >
        <span className="mobile-glyph-wrap">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ color: '#f59e0b' }}
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="rgba(245, 158, 11, 0.22)" />
          </svg>
        </span>
        <span className="mobile-star-badge">{starCountFormatted}</span>
      </a>

      {/* 5. Theme Toggle */}
      <button
        type="button"
        onClick={toggleTheme}
        className="mobile-pill-btn"
        aria-label="Toggle theme"
      >
        <span className="mobile-glyph-wrap">
          {resolvedTheme === 'dark' ? (
            <Moon size={15} strokeWidth={1.5} />
          ) : (
            <Sun size={15} strokeWidth={1.5} />
          )}
        </span>
        <span className="mobile-pill-label">{resolvedTheme === 'dark' ? 'dark' : 'light'}</span>
      </button>
    </nav>
  );
};
