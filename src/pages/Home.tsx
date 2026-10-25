import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toolsRegistry } from '../tools/registry';
import { PrivacyBadge } from '../components/PrivacyBadge';
import { ToolDef } from '../types';

export const HomePage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  function matchTool(tool: ToolDef, q: string): boolean {
    if (!q) return true;
    const cleanQ = q.toLowerCase().trim();
    const name = tool.name.toLowerCase();
    const desc = tool.description.toLowerCase();
    const keywords = tool.keywords.map(k => k.toLowerCase()).join(' ');

    if (name.includes(cleanQ) || desc.includes(cleanQ) || keywords.includes(cleanQ)) {
      return true;
    }

    let qIdx = 0;
    for (let i = 0; i < name.length && qIdx < cleanQ.length; i++) {
      if (name[i] === cleanQ[qIdx]) qIdx++;
    }
    return qIdx === cleanQ.length;
  }

  const filteredTools = toolsRegistry.filter(t => matchTool(t, searchQuery));

  return (
    <div className="page-container">
      <section className="home-hero">
        <div className="home-hero-crumbs">
          <span className="accent">~/shapedinto</span>
          <span>·</span>
          <span>local file studio</span>
        </div>

        <h1 className="home-hero-title">
          Private, fast, client-side file tools for images &amp; PDFs.
        </h1>

        <p className="home-hero-desc">
          All processing runs 100% inside your browser. No files are uploaded to any server, no trackers, no limits.
        </p>

        <PrivacyBadge style={{ marginTop: '4px' }} />
      </section>

      <div className="search-bar-wrap" style={{ maxWidth: '640px', margin: '0 auto', width: '100%' }}>
        <svg
          className="search-icon-pos"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>

        <input
          type="text"
          className="search-input"
          placeholder="Search tools, formats, or actions (e.g. ocr, jpg to pdf, split, compress)..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />

        <span className="search-kbd-hint">⌘K</span>
      </div>

      {filteredTools.length === 0 ? (
        <div
          style={{
            padding: '60px 20px',
            textAlign: 'center',
            background: 'var(--surface-card)',
            border: '1px dashed var(--border-dashed)',
            borderRadius: 'var(--radius-card)',
            margin: '0 auto',
            maxWidth: '500px',
            width: '100%'
          }}
        >
          <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
            No tool found.
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Try searching for "pdf", "image", or "text".
          </div>
          <button onClick={() => setSearchQuery('')} className="btn-secondary">
            view all 14 tools
          </button>
        </div>
      ) : (
        <div className="home-grid">
          {filteredTools.map((tool, index) => {
            const colorClass = index % 3 === 0 ? 'card-amber' : index % 3 === 1 ? 'card-indigo' : 'card-green';

            return (
              <Link
                key={tool.id}
                to={tool.route}
                className={`tool-preview-card ${colorClass}`}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div className="tool-card-icon-wrap">
                    {tool.icon({ className: 'w-5 h-5' })}
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', opacity: 0.7 }}>
                    0{index + 1}.
                  </span>
                </div>

                <div className="tool-card-name">
                  <span>{tool.name}</span>
                  <span style={{ fontSize: '14px', opacity: 0.7 }}>→</span>
                </div>

                <p className="tool-card-desc">
                  {tool.description}
                </p>

                <div className="tool-card-keywords">
                  {tool.keywords.slice(0, 3).map((kw, i) => (
                    <span key={i} className="keyword-tag">{kw}</span>
                  ))}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};
