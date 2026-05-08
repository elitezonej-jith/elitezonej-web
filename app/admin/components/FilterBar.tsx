"use client";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useTransition, useEffect } from "react";

export type FilterChip = {
  key: string;
  label: string;
  active: boolean;
  href: string;
  danger?: boolean;
};

export default function FilterBar({
  chips,
  searchParam = "q",
  placeholder = "Search…",
}: {
  chips: FilterChip[];
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
    if (val) next.set(searchParam, val);
    else next.delete(searchParam);
    next.delete("page");
    startTransition(() => router.push(`${pathname}?${next.toString()}`));
  };

  return (
    <div className="adm-filters">
      <input
        className="adm-filters__search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") submit(q); }}
        onBlur={() => { if (q !== (sp.get(searchParam) ?? "")) submit(q); }}
        placeholder={placeholder}
      />
      {chips.map((c) => (
        <a
          key={c.key}
          href={c.href}
          className={"adm-filters__chip" + (c.active ? " active" : "") + (c.danger ? " danger" : "")}
        >
          {c.label}
        </a>
      ))}
    </div>
  );
}
