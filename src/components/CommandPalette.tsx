import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toolsRegistry } from '../tools/registry';
import { ToolDef } from '../types';
import { Search, CornerDownLeft, Clock, Sparkles } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const RECENT_KEY = 'shapedinto_recent_tools';

export const CommandPalette: React.FC<Props> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Focus trap & return focus
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      setQuery('');
      setSelectedIndex(0);
      const timer = setTimeout(() => inputRef.current?.focus(), 40);
      return () => clearTimeout(timer);
    } else {
      previousFocusRef.current?.focus();
    }
  }, [isOpen]);

  // Read recent tools
  const getRecentIds = (): string[] => {
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };

  const saveRecentId = (id: string) => {
    try {
      const current = getRecentIds().filter(x => x !== id);
      const updated = [id, ...current].slice(0, 3);
      localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
    } catch {}
  };

  // Fuzzy scoring
  function scoreMatch(tool: ToolDef, q: string): { score: number; matchSnippet?: string } {
    if (!q) return { score: 1 };
    const cleanQ = q.toLowerCase().trim();
    const name = tool.name.toLowerCase();
    const desc = tool.description.toLowerCase();
    const keywords = tool.keywords.map(k => k.toLowerCase());

    if (name === cleanQ) return { score: 100 };
    if (name.startsWith(cleanQ)) return { score: 85 };
    if (name.includes(cleanQ)) return { score: 70 };

    // Keyword match
    const matchedKeyword = keywords.find(k => k.includes(cleanQ) || cleanQ.includes(k));
    if (matchedKeyword) return { score: 60, matchSnippet: matchedKeyword };

    if (desc.includes(cleanQ)) return { score: 40 };

    // Fuzzy subsequence
    let qIdx = 0;
    for (let i = 0; i < name.length && qIdx < cleanQ.length; i++) {
      if (name[i] === cleanQ[qIdx]) qIdx++;
    }
    if (qIdx === cleanQ.length) return { score: 25 };

    return { score: 0 };
  }

  const recentIds = getRecentIds();

  let displayedTools: ToolDef[] = [];
  if (!query.trim()) {
    const recentTools = recentIds
      .map(id => toolsRegistry.find(t => t.id === id))
      .filter((t): t is ToolDef => Boolean(t));
    const otherTools = toolsRegistry.filter(t => !recentIds.includes(t.id));
    displayedTools = [...recentTools, ...otherTools];
  } else {
    displayedTools = toolsRegistry
      .map(tool => ({ tool, match: scoreMatch(tool, query) }))
      .filter(item => item.match.score > 0)
      .sort((a, b) => b.match.score - a.match.score)
      .map(item => item.tool);
  }

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Ensure active item is visible in scroll
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.children[selectedIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, displayedTools.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + displayedTools.length) % Math.max(1, displayedTools.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (displayedTools[selectedIndex]) {
        saveRecentId(displayedTools[selectedIndex].id);
        navigate(displayedTools[selectedIndex].route);
        onClose();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  const highlightMatch = (text: string, q: string) => {
    if (!q.trim()) return text;
    const cleanQ = q.trim();
    const regex = new RegExp(`(${cleanQ.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      part.toLowerCase() === cleanQ.toLowerCase() ? (
        <mark key={i} className="palette-match">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  if (!isOpen) return null;

  return (
    <div className="palette-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Search tools">
      <div className="palette-window" onClick={e => e.stopPropagation()}>
        <div className="palette-header">
          <Search size={16} className="palette-search-icon" />
          <input
            ref={inputRef}
            type="text"
            className="palette-input"
            placeholder="Search tools, formats, or actions (e.g. ocr, jpg to pdf, split)..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-autocomplete="list"
          />
          <kbd className="palette-esc-badge" onClick={onClose}>ESC</kbd>
        </div>

        <div className="palette-list" ref={listRef} role="listbox">
          {displayedTools.length === 0 ? (
            <div className="palette-empty-state">
              <div className="empty-title">No tool found.</div>
              <div className="empty-sub">Try searching for "pdf", "image", or "ocr".</div>
            </div>
          ) : (
            displayedTools.map((tool, idx) => {
              const isSelected = idx === selectedIndex;
              const isRecent = !query.trim() && recentIds.includes(tool.id);

              return (
                <div
                  key={tool.id}
                  role="option"
                  aria-selected={isSelected}
                  className={`palette-item ${isSelected ? 'active' : ''}`}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  onClick={() => {
                    saveRecentId(tool.id);
                    navigate(tool.route);
                    onClose();
                  }}
                >
                  <div className="palette-item-left">
                    <div className="palette-icon-wrap">
                      {tool.icon({ size: 16 })}
                    </div>
                    <div className="palette-meta">
                      <div className="palette-item-title-row">
                        <span className="palette-item-title">
                          {highlightMatch(tool.name, query)}
                        </span>
                        {isRecent && (
                          <span className="recent-badge">
                            <Clock size={10} />
                            Recent
                          </span>
                        )}
                        {tool.featured && !isRecent && (
                          <span className="featured-pill">
                            <Sparkles size={10} />
                            Featured
                          </span>
                        )}
                      </div>
                      <div className="palette-item-desc">
                        {highlightMatch(tool.description, query)}
                      </div>
                    </div>
                  </div>

                  <div className="palette-enter-hint">
                    <CornerDownLeft size={12} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
