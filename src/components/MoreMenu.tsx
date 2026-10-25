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
  const menuRef = useRef<HTMLDivElement>(null);

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
        menuRef.current &&
        !menuRef.current.contains(target) &&
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
    <>
      {/* Mobile backdrop */}
      <div className="more-menu-backdrop" onClick={onClose} aria-hidden="true" />

      {/* Menu Container (Popover on Desktop, Sheet on Mobile) */}
      <div className="more-menu-container" ref={menuRef} role="dialog" aria-modal="true" aria-label="All file tools">
        <div className="more-menu-header-mobile">
          <span className="more-menu-mobile-title">All File Tools</span>
          <button className="icon-btn-subtle" onClick={onClose} aria-label="Close menu">
            <X size={18} />
          </button>
        </div>

        <div className="more-menu-grid">
          {groups.map(group => (
            <div key={group.title} className="more-menu-column">
              <div className="more-menu-group-title">{group.title}</div>
              <div className="more-menu-list">
                {group.tools.map(tool => (
                  <Link
                    key={tool.id}
                    to={tool.route}
                    className="more-menu-item"
                    onClick={onClose}
                  >
                    <div className="more-menu-icon-wrap">
                      {tool.icon({ size: 16 })}
                    </div>
                    <div className="more-menu-text-wrap">
                      <div className="more-menu-item-name">
                        <span>{tool.name}</span>
                        <ArrowRight size={12} className="more-menu-arrow" />
                      </div>
                      <div className="more-menu-item-desc">{tool.description}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};
