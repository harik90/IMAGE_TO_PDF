import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Monitor, Check } from 'lucide-react';
import { useTheme, ThemeMode } from '../utils/theme';

export const ThemeToggle: React.FC = () => {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const options: { id: ThemeMode; label: string; icon: React.ReactNode }[] = [
    { id: 'dark', label: 'Dark', icon: <Moon size={13} strokeWidth={1.75} /> },
    { id: 'light', label: 'Light', icon: <Sun size={13} strokeWidth={1.75} /> },
    { id: 'system', label: 'System', icon: <Monitor size={13} strokeWidth={1.75} /> }
  ];

  return (
    <div className="theme-toggle-wrap" ref={containerRef}>
      <button
        type="button"
        className={`header-theme-btn ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(prev => !prev)}
        title={`Theme: ${theme} (${resolvedTheme})`}
        aria-label="Toggle theme"
        aria-expanded={isOpen}
      >
        {resolvedTheme === 'dark' ? (
          <Moon size={13} strokeWidth={1.75} />
        ) : (
          <Sun size={13} strokeWidth={1.75} />
        )}
      </button>

      {isOpen && (
        <div className="theme-menu-popover" role="menu">
          {options.map(opt => (
            <button
              key={opt.id}
              role="menuitem"
              className={`theme-menu-item ${theme === opt.id ? 'active' : ''}`}
              onClick={() => {
                setTheme(opt.id);
                setIsOpen(false);
              }}
            >
              <span className="theme-opt-icon">{opt.icon}</span>
              <span className="theme-opt-label">{opt.label}</span>
              {theme === opt.id && <Check size={11} strokeWidth={2} className="theme-opt-check" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
