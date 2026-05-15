"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

type WishlistCtx = {
  slugs: string[];           // ordered, most-recent first
  count: number;
  hydrated: boolean;
  has: (slug: string) => boolean;
  add: (slug: string) => void;
  remove: (slug: string) => void;
  toggle: (slug: string) => void;
  clear: () => void;
};

const WishlistContext = createContext<WishlistCtx | null>(null);
const STORAGE_KEY = "ezj-wishlist-v1";

function loadFromStorage(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === "string");
  } catch {
    return [];
  }
}

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [slugs, setSlugs] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const skipPersistRef = useRef(true);

  useEffect(() => {
    setSlugs(loadFromStorage());
    setHydrated(true);
    skipPersistRef.current = false;
  }, []);

  useEffect(() => {
    if (skipPersistRef.current) return;
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(slugs)); } catch {}
  }, [slugs]);

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key !== STORAGE_KEY) return;
      setSlugs(loadFromStorage());
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const slugSet = useMemo(() => new Set(slugs), [slugs]);
  const has = useCallback((slug: string) => slugSet.has(slug), [slugSet]);
  const add = useCallback((slug: string) => {
    setSlugs(prev => prev.includes(slug) ? prev : [slug, ...prev]);
  }, []);
  const remove = useCallback((slug: string) => {
    setSlugs(prev => prev.filter(s => s !== slug));
  }, []);
  const toggle = useCallback((slug: string) => {
    setSlugs(prev => prev.includes(slug) ? prev.filter(s => s !== slug) : [slug, ...prev]);
  }, []);
  const clear = useCallback(() => setSlugs([]), []);

  const value: WishlistCtx = useMemo(() => ({
    slugs, count: slugs.length, hydrated, has, add, remove, toggle, clear,
  }), [slugs, hydrated, has, add, remove, toggle, clear]);

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist(): WishlistCtx {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within <WishlistProvider>");
  return ctx;
}
