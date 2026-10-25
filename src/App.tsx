import React, { useState, useEffect, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { CommandPalette } from './components/CommandPalette';
import { HomePage } from './pages/Home';
import { toolsRegistry } from './tools/registry';

const RouteObserver: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
    const activeTool = toolsRegistry.find(t => t.route === location.pathname);
    document.title = activeTool
      ? `${activeTool.name} — shapedinto (100% private)`
      : 'shapedinto — 100% private, client-side file tools';
  }, [location.pathname]);

  return null;
};

export const App: React.FC = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <BrowserRouter>
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
            <Route path="/" element={<HomePage />} />
            {toolsRegistry.map(tool => {
              const Component = tool.component;
              return <Route key={tool.id} path={tool.route} element={<Component />} />;
            })}
            <Route path="*" element={<HomePage />} />
          </Routes>
        </Suspense>
      </main>

      <Footer />
      <CommandPalette isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </BrowserRouter>
  );
};
