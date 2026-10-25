import { useState, useEffect, useRef, useCallback } from 'react';

export interface GitHubStarConfig {
  owner?: string;
  repo?: string;
  pollIntervalMs?: number;
}

export function formatStarCount(count: number): string {
  if (count >= 1000000) return (count / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (count >= 1000) return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return count.toString();
}

function parseShieldsValue(raw: any): number | null {
  if (!raw) return null;
  if (typeof raw === 'number') return raw;
  const s = String(raw).trim().toLowerCase();
  if (s.endsWith('m')) return Math.round(parseFloat(s) * 1000000);
  if (s.endsWith('k')) return Math.round(parseFloat(s) * 1000);
  const n = parseInt(s, 10);
  return isNaN(n) ? null : n;
}

export function useGitHubStars(config?: GitHubStarConfig) {
  const owner = config?.owner || 'harik90';
  const repo = config?.repo || 'IMAGE_TO_PDF';
  const pollInterval = config?.pollIntervalMs || 20000; // 20s auto-refresh
  const cacheKey = `gh_stars_${repo}`;

  const [stars, setStars] = useState<number | null>(() => {
    if (typeof window === 'undefined') return 2;
    try {
      const cached = localStorage.getItem(cacheKey);
      return cached !== null ? parseInt(cached, 10) : 2;
    } catch {
      return 2;
    }
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasUpdated, setHasUpdated] = useState<boolean>(false);
  const lastFetchedRef = useRef<number>(0);

  const fetchLiveStars = useCallback(async () => {
    // Throttle focus fetches to at most once per 4 seconds
    const now = Date.now();
    if (now - lastFetchedRef.current < 4000) return;
    lastFetchedRef.current = now;

    setIsLoading(true);
    let resolvedCount: number | null = null;

    // 1. Primary Source: Official GitHub API
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
        signal: controller.signal,
        headers: { Accept: 'application/vnd.github.v3+json' }
      });
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        if (typeof data.stargazers_count === 'number') {
          resolvedCount = data.stargazers_count;
        }
      }
    } catch {
      // Primary fetch failed or timed out; proceed to fallback
    }

    // 2. Fallback Source: Shields.io (Anti Rate-Limit)
    if (resolvedCount === null) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const res = await fetch(`https://img.shields.io/github/stars/${owner}/${repo}.json`, {
          signal: controller.signal
        });
        clearTimeout(timeout);

        if (res.ok) {
          const data = await res.json();
          resolvedCount = parseShieldsValue(data.value || data.message);
        }
      } catch {
        // Fallback fetch failed
      }
    }

    // 3. Update state & persist to LocalStorage
    if (resolvedCount !== null) {
      setStars(prev => {
        if (prev !== null && prev !== resolvedCount) {
          setHasUpdated(true);
          setTimeout(() => setHasUpdated(false), 2000);
        }
        return resolvedCount;
      });

      try {
        localStorage.setItem(cacheKey, resolvedCount.toString());
      } catch {}
    }

    setIsLoading(false);
  }, [owner, repo, cacheKey]);

  useEffect(() => {
    fetchLiveStars();

    // 1. Poll every 20 seconds
    const interval = setInterval(fetchLiveStars, pollInterval);

    // 2. Refresh immediately on window focus & tab visibility
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
  }, [fetchLiveStars, pollInterval]);

  const repoUrl = `https://github.com/${owner}/${repo}`;

  return { stars, repoUrl, isLoading, hasUpdated };
}
