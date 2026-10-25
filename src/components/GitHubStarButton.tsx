import React from 'react';
import { useGitHubStars, formatStarCount } from '../utils/github';
import { Star } from 'lucide-react';

interface Props {
  className?: string;
  compact?: boolean;
}

export const GitHubStarButton: React.FC<Props> = ({ className = '', compact = false }) => {
  const { stars, repoUrl, hasUpdated } = useGitHubStars();
  const formatted = stars !== null ? formatStarCount(stars) : '2';

  return (
    <a
      href={repoUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`craft-star-btn ${compact ? 'compact' : ''} ${hasUpdated ? 'updated-pulse' : ''} ${className}`}
      title="Star harik90/IMAGE_TO_PDF on GitHub · Updates in realtime"
      aria-label="GitHub Repository and Star count"
    >
      <Star
        size={13}
        strokeWidth={1.75}
        className="star-svg-lucide"
      />
      <span className="star-text">star</span>
      <span className="star-live-num">{formatted}</span>
    </a>
  );
};
