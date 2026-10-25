import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { CommandPalette } from './components/CommandPalette';
import { HomePage } from './pages/Home';
import { toolsRegistry } from './tools/registry';

// Dynamic Title & Scroll Reset on Route Change
const RouteObserver: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
    const activeTool = toolsRegistry.find(t => t.route === location.pathname);
    if (activeTool) {
      document.title = `${activeTool.name} — shapedinto (100% private)`;
    } else {
      document.title = 'shapedinto — 100% private, client-side file tools';
    }
  }, [location.pathname]);

  return null;
};

export const AppContent: React.FC = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Global Ctrl/Cmd + K shortcut
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
    <>
      <RouteObserver />
      <Header onOpenSearch={() => setIsSearchOpen(true)} />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          {toolsRegistry.map(tool => {
            const Component = tool.component;
            return <Route key={tool.id} path={tool.route} element={<Component />} />;
          })}
          {/* Fallback to home */}
          <Route path="*" element={<HomePage />} />
        </Routes>
      </main>

      <Footer />
      <CommandPalette isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
};
