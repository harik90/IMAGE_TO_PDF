import { useState, useEffect } from 'react';

export type ThemeMode = 'system' | 'dark' | 'light';

const THEME_KEY = 'image_to_pdf_theme';

export function getSystemTheme(): 'dark' | 'light' {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    try {
      return (
        (localStorage.getItem(THEME_KEY) as ThemeMode) ||
        (localStorage.getItem('shapedinto_theme') as ThemeMode) ||
        'system'
      );
    } catch {
      return 'system';
    }
  });

  const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>(() => {
    const saved =
      typeof window !== 'undefined'
        ? localStorage.getItem(THEME_KEY) || localStorage.getItem('shapedinto_theme')
        : null;
    if (saved === 'dark' || saved === 'light') return saved;
    return getSystemTheme();
  });

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(THEME_KEY, newTheme);
    } catch {}

    const resolved = newTheme === 'system' ? getSystemTheme() : newTheme;
    setResolvedTheme(resolved);
    document.documentElement.setAttribute('data-theme', resolved);
  };

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = () => {
      if (theme === 'system') {
        const resolved = media.matches ? 'dark' : 'light';
        setResolvedTheme(resolved);
        document.documentElement.setAttribute('data-theme', resolved);
      }
    };

    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [theme]);

  return { theme, resolvedTheme, setTheme };
}
