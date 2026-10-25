import React, { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { toolsRegistry } from '../tools/registry';
import { X, ArrowRight } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  triggerRef?: React.RefObject<HTMLElement | null>;
}

export const MoreMenu: React.FC<Props> = ({ isOpen, onClose, triggerRef }) => {
  const location = useLocation();
  const windowRef = useRef<HTMLDivElement>(null);

  // Close on route change
  useEffect(() => {
    if (isOpen) {
      onClose();
    }
  }, [location.pathname]);

  // Close on click outside & Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        windowRef.current &&
        !windowRef.current.contains(target) &&
        triggerRef?.current &&
        !triggerRef.current.contains(target)
      ) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen) return null;

  const pdfTools = toolsRegistry.filter(t => t.category === 'pdf');
  const imageTools = toolsRegistry.filter(t => t.category === 'image');
  const textTools = toolsRegistry.filter(t => t.category === 'text');

  const groups = [
    { title: 'PDF Tools', tools: pdfTools },
    { title: 'Image Tools', tools: imageTools },
    { title: 'Text & OCR', tools: textTools }
  ];

  return (
    <div
      className="more-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="All file utilities"
    >
      <div
        className="more-modal-window"
        ref={windowRef}
        onClick={e => e.stopPropagation()}
      >
        <div className="more-modal-header">
          <div className="more-modal-title-group">
            <span className="more-modal-title">all utilities</span>
            <span className="accent-script-note">*(14 in-memory tools)*</span>
          </div>

          <button
            type="button"
            className="icon-btn-subtle"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={16} />
          </button>
        </div>

        <div className="more-modal-body">
          {groups.map(group => (
            <div key={group.title} className="more-modal-column">
              <div className="more-modal-group-title">{group.title}</div>
              <div className="more-modal-list">
                {group.tools.map(tool => (
                  <Link
                    key={tool.id}
                    to={tool.route}
                    className="more-modal-item"
                    onClick={onClose}
                  >
                    <div className="more-modal-icon-wrap">
                      {tool.icon({ size: 15 })}
                    </div>
                    <div className="more-modal-text-wrap">
                      <div className="more-modal-item-name">
                        <span>{tool.name}</span>
                        <ArrowRight size={11} className="more-modal-arrow" />
                      </div>
                      <div className="more-modal-item-desc" title={tool.description}>
                        {tool.description}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
