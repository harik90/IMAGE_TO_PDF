import { useState, useEffect, useRef, useCallback } from 'react';

const REPO_URL = 'https://github.com/harik90/IMAGE_TO_PDF';
const API_URL = 'https://api.github.com/repos/harik90/IMAGE_TO_PDF';
const CACHE_KEY = 'image_to_pdf_stars';
const CACHE_TS_KEY = 'image_to_pdf_stars_ts';

export function formatStarCount(count: number): string {
  if (count >= 1000000) return (count / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (count >= 1000) return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return count.toString();
}

export function useGitHubStars() {
  const [stars, setStars] = useState<number | null>(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      return cached !== null ? parseInt(cached, 10) : 2;
    } catch {
      return 2;
    }
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasUpdated, setHasUpdated] = useState<boolean>(false);
  const lastFetchedRef = useRef<number>(0);

  const fetchLiveStars = useCallback(async () => {
    const now = Date.now();
    // Throttle focus fetches to at most once per 6 seconds to respect rate limits
    if (now - lastFetchedRef.current < 6000) return;
    lastFetchedRef.current = now;

    setIsLoading(true);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    try {
      const res = await fetch(API_URL, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      if (!res.ok) return;

      const data = await res.json();
      if (typeof data.stargazers_count === 'number') {
        setStars(prev => {
          if (prev !== null && prev !== data.stargazers_count) {
            setHasUpdated(true);
            setTimeout(() => setHasUpdated(false), 2400);
          }
          return data.stargazers_count;
        });

        try {
          localStorage.setItem(CACHE_KEY, data.stargazers_count.toString());
          localStorage.setItem(CACHE_TS_KEY, Date.now().toString());
        } catch {}
      }
    } catch {
      // Gracefully preserve cached value without throwing or flashing UI
    } finally {
      setIsLoading(false);
      clearTimeout(timeout);
    }
  }, []);

  useEffect(() => {
    fetchLiveStars();

    // 1. Periodic realtime polling every 30 seconds
    const interval = setInterval(fetchLiveStars, 30000);

    // 2. Realtime wakeup on window focus (e.g. when user stars on GitHub and comes back)
    const handleFocus = () => fetchLiveStars();
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') fetchLiveStars();
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [fetchLiveStars]);

  return { stars, repoUrl: REPO_URL, isLoading, hasUpdated };
}
