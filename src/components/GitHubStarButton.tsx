import React from 'react';
import { useGitHubStars, formatStarCount } from '../utils/github';

interface Props {
  className?: string;
  compact?: boolean;
}

export const GitHubStarButton: React.FC<Props> = ({ className = '', compact = false }) => {
  const { stars, repoUrl } = useGitHubStars();
  const formatted = stars !== null ? formatStarCount(stars) : null;

  return (
    <a
      href={repoUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`craft-star-btn ${compact ? 'compact' : ''} ${className}`}
      title="Star harik90/IMAGE_TO_PDF on GitHub"
      aria-label="GitHub Repository and Star count"
    >
      <svg
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="star-svg"
      >
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
      </svg>
      <span className="star-text">star</span>
      {formatted && <span className="star-live-num">{formatted}</span>}
    </a>
  );
};
