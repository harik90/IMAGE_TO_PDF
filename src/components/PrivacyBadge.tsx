import React from 'react';

interface Props {
  className?: string;
  style?: React.CSSProperties;
}

export const PrivacyBadge: React.FC<Props> = ({ className = '', style }) => {
  return (
    <div className={`privacy-badge ${className}`} style={style} title="All processing occurs 100% locally in your browser memory">
      <span className="pulse-dot"></span>
      <span>Files never leave your device. Processed in your browser.</span>
    </div>
  );
};
