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

    let qIdx = 0;
    for (let i = 0; i < name.length && qIdx < cleanQ.length; i++) {
      if (name[i] === cleanQ[qIdx]) qIdx++;
    }
    return qIdx === cleanQ.length ? 20 : 0;
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
    <div className="palette-overlay" onClick={onClose}>
      <div className="palette-window" onClick={e => e.stopPropagation()}>
        <div className="palette-header">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)' }}>
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            ref={inputRef}
            type="text"
            className="palette-input"
            placeholder="Type a tool name or keyword (e.g. ocr, jpg to pdf, split)..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <kbd style={{ fontSize: '11px', color: 'var(--text-muted)', border: '1px solid var(--border-dim)', padding: '2px 6px', borderRadius: '4px' }}>ESC</kbd>
        </div>

        <div className="palette-list">
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
                  className={`palette-item ${isSelected ? 'active' : ''}`}
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
