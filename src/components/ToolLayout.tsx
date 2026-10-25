import React, { ReactNode } from 'react';
import { PrivacyBadge } from './PrivacyBadge';

interface Props {
  title: string;
  description: string;
  amberCardContent: ReactNode;
  indigoCardContent: ReactNode;
  greenCardContent: ReactNode;
  fileSequenceContent?: ReactNode;
  howItWorks?: string;
  faq?: string;
}

export const ToolLayout: React.FC<Props> = ({
  title,
  description,
  amberCardContent,
  indigoCardContent,
  greenCardContent,
  fileSequenceContent,
  howItWorks,
  faq
}) => {
  return (
    <div className="page-container">
      <div className="tool-top-row">
        <div>
          <h1 className="tool-title">{title}</h1>
          <p className="tool-desc">{description}</p>
        </div>
        <PrivacyBadge />
      </div>

      <div className="tool-grid">
        <div className="craft-card card-amber">
          {amberCardContent}
        </div>

        <div className="craft-card card-indigo">
          {indigoCardContent}
        </div>

        <div className="craft-card card-green tool-grid-full">
          {greenCardContent}
        </div>
      </div>

      {fileSequenceContent && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {fileSequenceContent}
        </div>
      )}

      {(howItWorks || faq) && (
        <div className="tool-info-card">
          {howItWorks && (
            <div>
              <div className="tool-info-heading">How it works</div>
              <div className="tool-info-body">{howItWorks}</div>
            </div>
          )}
          {faq && (
            <div style={{ borderTop: '1px dashed var(--border-dim)', paddingTop: '10px' }}>
              <div className="tool-info-heading">FAQ &amp; Security</div>
              <div className="tool-info-body" style={{ color: 'var(--text-muted)' }}>{faq}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
