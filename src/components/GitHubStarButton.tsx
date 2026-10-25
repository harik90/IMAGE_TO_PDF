import React from 'react';
import { Star } from 'lucide-react';
import { useGitHubStars, formatStarCount } from '../utils/github';

interface Props {
  className?: string;
  compact?: boolean;
}

export const GitHubStarButton: React.FC<Props> = ({ className = '', compact = false }) => {
  const { stars, repoUrl } = useGitHubStars();
  const formattedStars = stars !== null ? formatStarCount(stars) : null;

  return (
    <a
      href={repoUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`github-star-btn ${compact ? 'compact' : ''} ${className}`}
      title="Star harik90/IMAGE_TO_PDF on GitHub"
      aria-label="Star harik90/IMAGE_TO_PDF on GitHub"
    >
      <Star size={14} className="star-icon" fill="currentColor" />
      <span className="star-label">Star</span>
      {formattedStars && <span className="star-count">{formattedStars}</span>}
    </a>
  );
};
