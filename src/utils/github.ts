import { useState, useEffect } from 'react';

const REPO_URL = 'https://github.com/harik90/IMAGE_TO_PDF';
const API_URL = 'https://api.github.com/repos/harik90/IMAGE_TO_PDF';
const CACHE_KEY = 'image_to_pdf_stars';
const CACHE_TS_KEY = 'image_to_pdf_stars_ts';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export function formatStarCount(count: number): string {
  if (count >= 1000000) return (count / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (count >= 1000) return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return count.toString();
}

export function useGitHubStars() {
  const [stars, setStars] = useState<number | null>(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      return cached !== null ? parseInt(cached, 10) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    async function fetchStars() {
      try {
        const cachedTs = localStorage.getItem(CACHE_TS_KEY);
        const cachedVal = localStorage.getItem(CACHE_KEY);
        const now = Date.now();

        if (cachedTs && cachedVal && now - parseInt(cachedTs, 10) < CACHE_TTL_MS) {
          return;
        }

        const res = await fetch(API_URL, { signal: controller.signal });
        if (!res.ok) return;

        const data = await res.json();
        if (typeof data.stargazers_count === 'number') {
          setStars(data.stargazers_count);
          localStorage.setItem(CACHE_KEY, data.stargazers_count.toString());
          localStorage.setItem(CACHE_TS_KEY, now.toString());
        }
      } catch {
        // Silently preserve existing cached value
      } finally {
        clearTimeout(timeout);
      }
    }

    fetchStars();
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, []);

  return { stars, repoUrl: REPO_URL };
}
