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

function parseCountValue(raw: unknown): number | null {
  if (raw === null || raw === undefined) return null;
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
  const pollInterval = config?.pollIntervalMs || 15000; // 15 seconds real-time poll
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
  const isFetchingRef = useRef<boolean>(false);

  const fetchLiveStars = useCallback(async (force = false) => {
    const now = Date.now();
    // Allow immediate refresh if force=true (e.g. on window focus or user click), otherwise debounce 3s
    if (!force && now - lastFetchedRef.current < 3000) return;
    if (isFetchingRef.current) return;

    isFetchingRef.current = true;
    lastFetchedRef.current = now;
    setIsLoading(true);

    let resolvedCount: number | null = null;
    const cacheBuster = `_t=${now}`;

    // 1. Primary Source: Official GitHub API with cache: 'no-store' & cache-buster timestamp
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4500);

      const res = await fetch(`https://api.github.com/repos/${owner}/${repo}?${cacheBuster}`, {
        signal: controller.signal,
        cache: 'no-store',
        headers: {
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        if (typeof data.stargazers_count === 'number') {
          resolvedCount = data.stargazers_count;
        }
      }
    } catch {
      // Primary failed or timed out; proceed to real-time fallbacks
    }

    // 2. Fallback Source 1: Badgen.net SVG (Fast & minimal cache)
    if (resolvedCount === null) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4500);

        const res = await fetch(`https://badgen.net/github/stars/${owner}/${repo}?cache=0&${cacheBuster}`, {
          signal: controller.signal,
          cache: 'no-store'
        });
        clearTimeout(timeout);

        if (res.ok) {
          const svgText = await res.text();
          const match = svgText.match(/stars:\s*([0-9.a-zA-Z]+)/i);
          if (match && match[1]) {
            resolvedCount = parseCountValue(match[1]);
          }
        }
      } catch {
        // Badgen failed; proceed to Shields
      }
    }

    // 3. Fallback Source 2: Shields.io JSON API with cacheSeconds=0
    if (resolvedCount === null) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4500);

        const res = await fetch(`https://img.shields.io/github/stars/${owner}/${repo}.json?cacheSeconds=0&${cacheBuster}`, {
          signal: controller.signal,
          cache: 'no-store'
        });
        clearTimeout(timeout);

        if (res.ok) {
          const data = await res.json();
          resolvedCount = parseCountValue(data.value || data.message);
        }
      } catch {
        // Fallback failed
      }
    }

    // Update state & persist when fresh count is resolved
    if (resolvedCount !== null) {
      setStars(prev => {
        if (prev !== null && prev !== resolvedCount) {
          setHasUpdated(true);
          setTimeout(() => setHasUpdated(false), 2400);
        }
        return resolvedCount;
      });

      try {
        localStorage.setItem(cacheKey, resolvedCount.toString());
      } catch {}
    }

    setIsLoading(false);
    isFetchingRef.current = false;
  }, [owner, repo, cacheKey]);

  useEffect(() => {
    // Immediate initial fetch
    fetchLiveStars(true);

    // 1. Periodic background poll every 15s
    const interval = setInterval(() => {
      fetchLiveStars(false);
    }, pollInterval);

    // 2. Unthrottled instantaneous fetch when user switches back to tab
    const handleFocus = () => fetchLiveStars(true);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchLiveStars(true);
      }
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('online', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [fetchLiveStars, pollInterval]);

  const repoUrl = `https://github.com/${owner}/${repo}`;

  return { stars, repoUrl, isLoading, hasUpdated, refresh: () => fetchLiveStars(true) };
}
