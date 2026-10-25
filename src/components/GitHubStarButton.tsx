import React from 'react';
import { useGitHubStars, formatStarCount } from '../utils/github';

export interface GitHubStarButtonProps {
  owner?: string;
  repo?: string;
  className?: string;
  compact?: boolean;
}

export const GitHubStarButton: React.FC<GitHubStarButtonProps> = ({
  owner = 'harik90',
  repo = 'IMAGE_TO_PDF',
  className = '',
  compact = false
}) => {
  const { stars, repoUrl, hasUpdated, refresh } = useGitHubStars({ owner, repo, pollIntervalMs: 15000 });
  const formattedCount = stars !== null ? formatStarCount(stars) : '2';

  const handleClick = () => {
    // Refresh immediately after opening repo
    setTimeout(() => refresh(), 1000);
  };

  return (
    <a
      href={repoUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className={`craft-star-btn ${compact ? 'compact' : ''} ${hasUpdated ? 'updated-pulse' : ''} ${className}`}
      title={`Star ${owner}/${repo} on GitHub · Live: ${formattedCount} stars`}
      aria-label={`GitHub Repository ${owner}/${repo} - ${formattedCount} stars`}
    >
      {/* Zero external dependencies: inline 1.75px SVG star */}
      <svg
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="rgba(245, 158, 11, 0.22)"
        stroke="#f59e0b"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="star-svg-lucide"
        aria-hidden="true"
      >
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
      <span className="star-text">star</span>
      <span className="star-live-num">{formattedCount}</span>
    </a>
  );
};
