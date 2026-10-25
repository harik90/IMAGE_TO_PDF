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
    { id: 'dark', label: 'Dark', icon: <Moon size={14} /> },
    { id: 'light', label: 'Light', icon: <Sun size={14} /> },
    { id: 'system', label: 'System', icon: <Monitor size={14} /> }
  ];

  return (
    <div className="theme-toggle-wrap" ref={containerRef}>
      <button
        type="button"
        className="icon-btn-subtle"
        onClick={() => setIsOpen(prev => !prev)}
        title={`Theme: ${theme} (${resolvedTheme})`}
        aria-label="Toggle theme"
        aria-expanded={isOpen}
      >
        {resolvedTheme === 'dark' ? <Moon size={15} /> : <Sun size={15} />}
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
              <span className="theme-menu-icon">{opt.icon}</span>
              <span className="theme-menu-label">{opt.label}</span>
              {theme === opt.id && <Check size={13} className="theme-menu-check" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
