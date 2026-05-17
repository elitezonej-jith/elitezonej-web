"use client";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
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
  useEffect(() => { setQ(sp.get(searchParam) ?? ""); }, [sp, searchParam]);

  const submit = (val: string) => {
    const next = new URLSearchParams(sp.toString());
    if (val) next.set(searchParam, val); else next.delete(searchParam);
    next.delete("page");
    startTransition(() => router.push(`${pathname}?${next.toString()}`));
  };

  return (
    <div className="stu-filters">
      <div className="stu-filters__search">
        <IconSearch className="stu-filters__search__icon" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") submit(q); }}
          onBlur={() => { if (q !== (sp.get(searchParam) ?? "")) submit(q); }}
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
