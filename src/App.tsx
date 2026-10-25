import React, { useState, useEffect, Suspense } from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { CommandPalette } from './components/CommandPalette';
import { MobilePillNav } from './components/MobilePillNav';
import { HomePage } from './pages/Home';
import { toolsRegistry } from './tools/registry';

const RouteObserver: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
    const activeTool = toolsRegistry.find(t => t.route === location.pathname);
    document.title = activeTool
      ? `${activeTool.name} — image_to_pdf (100% private)`
      : 'image_to_pdf — 100% private, client-side file tools';
  }, [location.pathname]);

  return null;
};

export const App: React.FC = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
        return;
      }

      // Single "/" key when not typing in an input
      if (e.key === '/') {
        const target = e.target as HTMLElement | null;
        const isEditable =
          target &&
          (target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.tagName === 'SELECT' ||
            target.isContentEditable);

        if (!isEditable) {
          e.preventDefault();
          setIsSearchOpen(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <HashRouter>
      <RouteObserver />
      <Header onOpenSearch={() => setIsSearchOpen(true)} />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Suspense
          fallback={
            <div className="page-container" style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text-muted)' }}>
              <span className="pulse-dot" style={{ display: 'inline-block', marginRight: '8px' }}></span>
              <span>loading tool...</span>
            </div>
          }
        >
          <Routes>
            <Route path="/" element={<HomePage onOpenSearch={() => setIsSearchOpen(true)} />} />
            {toolsRegistry.map(tool => {
              const Component = tool.component;
              return <Route key={tool.id} path={tool.route} element={<Component />} />;
            })}
            <Route path="*" element={<HomePage onOpenSearch={() => setIsSearchOpen(true)} />} />
          </Routes>
        </Suspense>
      </main>

      <Footer />
      <MobilePillNav onOpenSearch={() => setIsSearchOpen(true)} />
      <CommandPalette isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </HashRouter>
  );
};
