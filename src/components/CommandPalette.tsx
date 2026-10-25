import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toolsRegistry } from '../tools/registry';
import { ToolDef } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<Props> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Fuzzy matching score helper
  function scoreMatch(tool: ToolDef, q: string): number {
    if (!q) return 1;
    const cleanQ = q.toLowerCase().trim();
    const name = tool.name.toLowerCase();
    const desc = tool.description.toLowerCase();
    const keywords = tool.keywords.map(k => k.toLowerCase()).join(' ');

    if (name === cleanQ) return 100;
    if (name.startsWith(cleanQ)) return 80;
    if (name.includes(cleanQ)) return 60;
    if (keywords.includes(cleanQ)) return 50;
    if (desc.includes(cleanQ)) return 30;

    // Subsequence fuzzy match
    let qIdx = 0;
    for (let i = 0; i < name.length && qIdx < cleanQ.length; i++) {
      if (name[i] === cleanQ[qIdx]) qIdx++;
    }
    if (qIdx === cleanQ.length) return 20;

    return 0;
  }

  const filteredTools = toolsRegistry
    .map(tool => ({ tool, score: scoreMatch(tool, query) }))
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(item => item.tool);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, filteredTools.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredTools.length) % Math.max(1, filteredTools.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredTools[selectedIndex]) {
        navigate(filteredTools[selectedIndex].route);
        onClose();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '80px 20px 20px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          background: 'var(--surface-solid)',
          border: '1px solid var(--border-dashed)',
          borderRadius: 'var(--radius-card)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', gap: '12px', borderBottom: '1px dashed var(--border-dim)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)' }}>
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            ref={inputRef}
            type="text"
            className="craft-input"
            style={{ border: 'none', background: 'transparent', fontSize: '15px', color: 'var(--text-primary)', padding: 0 }}
            placeholder="Type a tool name or keyword (e.g. ocr, jpg to pdf, split)..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <kbd style={{ fontSize: '11px', color: 'var(--text-muted)', border: '1px solid var(--border-dim)', padding: '2px 6px', borderRadius: '4px' }}>ESC</kbd>
        </div>

        <div style={{ maxHeight: '360px', overflowY: 'auto', padding: '8px' }}>
          {filteredTools.length === 0 ? (
            <div style={{ padding: '28px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '14px', marginBottom: '4px' }}>No tool found.</div>
              <div style={{ fontSize: '12px' }}>Try 'pdf', 'image' or 'text'.</div>
            </div>
          ) : (
            filteredTools.map((tool, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={tool.id}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-well)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    background: isSelected ? 'rgba(61, 220, 151, 0.12)' : 'transparent',
                    border: isSelected ? '1px solid rgba(61, 220, 151, 0.3)' : '1px solid transparent',
                    transition: 'all 120ms ease'
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  onClick={() => {
                    navigate(tool.route);
                    onClose();
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                    <div className="glyph-badge" style={{ color: isSelected ? 'var(--mint-primary)' : 'inherit' }}>
                      {tool.icon({ className: 'w-4 h-4' })}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, color: isSelected ? 'var(--mint-primary)' : 'var(--text-primary)', fontSize: '14px' }}>
                        {tool.name}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {tool.description}
                      </div>
                    </div>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>↵</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
