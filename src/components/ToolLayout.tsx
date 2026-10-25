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
      {/* Top Tool Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '26px', marginBottom: '6px' }}>{title}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '640px' }}>
            {description}
          </p>
        </div>
        <PrivacyBadge />
      </div>

      {/* 3-Card Tool Architecture Grid */}
      <div className="tool-grid">
        {/* Amber Card (Import) */}
        <div className="craft-card card-amber">
          {amberCardContent}
        </div>

        {/* Indigo Card (Settings) */}
        <div className="craft-card card-indigo">
          {indigoCardContent}
        </div>

        {/* Green Card (Output & Stats) - spans both columns */}
        <div className="craft-card card-green tool-grid-full">
          {greenCardContent}
        </div>
      </div>

      {/* File Sequence / List below cards */}
      {fileSequenceContent && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {fileSequenceContent}
        </div>
      )}

      {/* How It Works & FAQ Box */}
      {(howItWorks || faq) && (
        <div
          style={{
            marginTop: '12px',
            padding: '20px',
            background: 'var(--surface-well)',
            border: '1px solid var(--border-dim)',
            borderRadius: 'var(--radius-well)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          {howItWorks && (
            <div>
              <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)', marginBottom: '4px' }}>
                How it works
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {howItWorks}
              </div>
            </div>
          )}
          {faq && (
            <div style={{ borderTop: '1px dashed var(--border-dim)', paddingTop: '10px' }}>
              <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)', marginBottom: '4px' }}>
                FAQ & Security
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                {faq}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
