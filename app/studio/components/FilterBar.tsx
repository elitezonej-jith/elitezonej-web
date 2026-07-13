"use client";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { IconSearch } from "./Icons";

export type Chip = { key: string; label: string; href: string; active: boolean };

export default function FilterBar({
  chips,
  searchParam = "q",
  placeholder = "Search…",
}: {
  chips: Chip[];
  searchParam?: string;
  placeholder?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get(searchParam) ?? "");
  const [, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync external URL changes (e.g. chip click resets search)
  useEffect(() => { setQ(sp.get(searchParam) ?? ""); }, [sp, searchParam]);

  const submit = (val: string) => {
    const next = new URLSearchParams(sp.toString());
    if (val) next.set(searchParam, val); else next.delete(searchParam);
    next.delete("page");
    startTransition(() => router.push(`${pathname}?${next.toString()}`));
  };

  // Debounced live search — fires 300ms after the user stops typing
  useEffect(() => {
    const current = sp.get(searchParam) ?? "";
    if (q === current) return; // no change — skip to prevent loops
    debounceRef.current = setTimeout(() => {
      submit(q);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  // Instant submit on Enter (cancels pending debounce via state change → effect cleanup)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      submit(q);
    }
  };

  return (
    <div className="stu-filters">
      <div className="stu-filters__search">
        <IconSearch className="stu-filters__search__icon" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label={placeholder}
        />
      </div>
      {chips.map((c) => (
        <a key={c.key} href={c.href} className={`stu-filters__chip${c.active ? " active" : ""}`}>
          {c.label}
        </a>
      ))}
    </div>
  );
}
