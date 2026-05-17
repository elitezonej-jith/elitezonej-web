"use client";
import { useState, useMemo } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { PRODUCTS } from "@/lib/products";
import { fmtINR } from "@/lib/format";
import { WHATSAPP_LINK } from "@/lib/contact";
import { imgFabric } from "@/lib/images";
import { CAT_DATA, SUBCATS } from "@/lib/subcats";
import WishlistButton from "../components/WishlistButton";
import QuickAddButton from "../components/QuickAddButton";
import Reveal from "../components/Reveal";
import "../styles/collection.css";


type FilterKey = "fit" | "fabric" | "occasion" | "size";

export default function CollectionClient({ cat, sub }: { cat: string; sub: string }) {
  const [active, setActive] = useState<Record<FilterKey, Set<string>>>({
    fit: new Set(), fabric: new Set(), occasion: new Set(), size: new Set(),
  });
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const SORTS = ["newest", "price-asc", "price-desc"] as const;
  const urlSort = searchParams.get("sort") ?? "";
  const sortKey = (SORTS as readonly string[]).includes(urlSort) ? urlSort : "newest";

  const setSortKey = (value: string) => {
    const next = new URLSearchParams(searchParams.toString());
    if (value === "newest") next.delete("sort");
    else next.set("sort", value);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const subData = sub ? SUBCATS[cat]?.[sub] : null;
  const headTitle = subData?.title || CAT_DATA[cat]?.title || "Collection";
  const headStand = subData?.stand || CAT_DATA[cat]?.stand || "";

  const toggle = (k: FilterKey, v: string) => {
    setActive(prev => {
      const next = { ...prev, [k]: new Set(prev[k]) };
      if (next[k].has(v)) next[k].delete(v); else next[k].add(v);
      return next;
    });
  };
  const clear = () => setActive({ fit: new Set(), fabric: new Set(), occasion: new Set(), size: new Set() });

  const isFabricMode = cat === "fabrics";

  const filtered = useMemo(() => {
    let list = PRODUCTS.slice();
    if (isFabricMode) {
      list = list.filter(p => p.kind === "fabric");
    } else {
      list = list.filter(p => p.kind !== "fabric");
      if (cat === "men" || cat === "women") list = list.filter(p => p.gender === cat);
      else if (cat === "festive") list = list.filter(p => p.occasion === "Festive");
      else if (cat === "new") list = list.filter(p => p.badge === "New");
      else if (cat !== "all") list = list.filter(p => p.category === cat);
    }
    if (sub) list = list.filter(p => p.sub === sub);
    if (!isFabricMode) {
      if (active.fit.size) list = list.filter(p => active.fit.has(p.fit));
      if (active.fabric.size) list = list.filter(p => active.fabric.has(p.fabric));
      if (active.occasion.size) list = list.filter(p => active.occasion.has(p.occasion));
    }
    // Sort by the price the customer actually pays (sale price when on sale).
    const eff = (x: typeof list[number]) => x.salePrice ?? x.price;
    if (sortKey === "price-asc") list = [...list].sort((a, b) => eff(a) - eff(b));
    if (sortKey === "price-desc") list = [...list].sort((a, b) => eff(b) - eff(a));
    return list;
  }, [cat, sub, active, sortKey, isFabricMode]);

  return (
    <>
      <section className="cat-header">
        <div className="crumb t-mono-xs">
          <Link href="/">Home</Link>
          <span className="sep">/</span>
          {subData ? (
            <>
              <Link href={`/collection?c=${cat}`}>{CAT_DATA[cat]?.title || cat}</Link>
              <span className="sep">/</span>
              <span>{headTitle}</span>
            </>
          ) : (
            <span>{headTitle}</span>
          )}
        </div>
        <h1>{headTitle}</h1>
        <p className="standfirst">{headStand}</p>
        <div className="signed t-mono-xs">— By the Elite Zone J design team · Spring/Summer 2026</div>
      </section>

      <div className="toolbar">
        <span className="count t-mono-xs">{filtered.length} piece{filtered.length === 1 ? "" : "s"}</span>
        <div className="sort">
          <label className="t-mono-xs" style={{ color: "var(--ink-3)" }}>Sort by</label>
          <select value={sortKey} onChange={e => setSortKey(e.target.value)}>
            <option value="newest">Newest</option>
            <option value="price-asc">Price · low to high</option>
            <option value="price-desc">Price · high to low</option>
          </select>
        </div>
      </div>

      <section className={`plp${isFabricMode ? " plp-fabric" : ""}`}>
        {!isFabricMode && (
          <aside className="filters">
            <FilterGroup name="Fit" values={["Slim","Tailored","Regular","Relaxed"]} active={active.fit} onToggle={v => toggle("fit", v)} />
            <FilterGroup name="Fabric" values={["Wool","Linen","Cotton","Silk","Velvet"]} active={active.fabric} onToggle={v => toggle("fabric", v)} />
            <FilterGroup name="Occasion" values={["Wedding","Boardroom","Black Tie","Festive","Casual"]} active={active.occasion} onToggle={v => toggle("occasion", v)} />
            <FilterGroup name="Size" values={["36","38","40","42","44","46","XS","S","M","L","XL","XXL"]} active={active.size} onToggle={v => toggle("size", v)} />
            <div className="filter-group">
              <h4>Price (₹)</h4>
              <div className="price-row">
                <input type="number" placeholder="Min" />
                <input type="number" placeholder="Max" />
              </div>
            </div>
            <a className="clear-link" onClick={clear}>Clear all filters</a>
          </aside>
        )}

        <div className="grid">
          {filtered.length === 0 ? (
            <div className="empty">
              <div className="t-mono-xs" style={{ color: "var(--ink-3)", marginBottom: "var(--s-4)" }}>Arriving Spring/Summer 2026</div>
              <h3>This collection is being shot.</h3>
              <p>We&apos;re photographing the new season at our Delhi atelier this week. Message us on WhatsApp and we&apos;ll write to you the morning it goes live.</p>
              <a className="btn btn-primary" href={`${WHATSAPP_LINK}?text=${encodeURIComponent("Hi Elite Zone J — please notify me when the new collection goes live.")}`} target="_blank" rel="noopener noreferrer">
                Notify me on WhatsApp
              </a>
              <div style={{ marginTop: "var(--s-5)" }}>
                <Link href={`/collection?c=${cat}`} className="t-mono-xs" style={{ color: "var(--ink-2)", textDecoration: "underline", textUnderlineOffset: "3px" }}>
                  View all {(CAT_DATA[cat]?.title || "pieces").toLowerCase()} →
                </Link>
              </div>
            </div>
          ) : isFabricMode ? (
            filtered.map((p, i) => (
              <Reveal as="div" key={p.slug} className="fabric-card qa-host" delay={(i % 4) as 0 | 1 | 2 | 3} aria-label={`${p.name} — ${p.colour}`}>
                <Link href={`/products/${p.slug}`} aria-label={p.name}>
                  <div className="swatch" style={{ backgroundColor: p.colourHex || "var(--paper-2)" }}>
                    {p.colour && (
                      <Image
                        src={imgFabric(p.slug, p.colour, "front")}
                        alt={`${p.name} — ${p.colour} texture`}
                        fill
                        sizes="(max-width: 720px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        loading="lazy"
                      />
                    )}
                    <WishlistButton slug={p.slug} name={p.name} />
                    <QuickAddButton product={p} />
                  </div>
                </Link>
                <Link href={`/products/${p.slug}`}>
                  <h3>{p.name}</h3>
                  <div className="col-row">
                    <span className="col-dot" style={{ backgroundColor: p.colourHex || "transparent" }} aria-hidden="true" />
                    <span>Colour · {p.colour}</span>
                  </div>
                  <p className="desc">{p.description}</p>
                </Link>
              </Reveal>
            ))
          ) : (
            filtered.map((p, i) => (
              <Reveal as="div" key={p.slug} className="pcard qa-host" delay={(i % 4) as 0 | 1 | 2 | 3}>
                <div className="plate">
                  <Link href={`/products/${p.slug}`} aria-label={p.name}>
                    <Image className="primary" src={`/generated/${p.slug}/01-front.webp`} alt={`${p.name} front`} fill sizes="(max-width: 720px) 50vw, 33vw" priority={i === 0} loading={i === 0 ? "eager" : "lazy"} />
                    <Image className="alt" src={`/generated/${p.slug}/02-overview.webp`} alt={`${p.name} overview`} fill sizes="(max-width: 720px) 50vw, 33vw" loading="lazy" />
                  </Link>
                  {(p.badge || p.salePrice) && (
                    <div className="badge-stack">
                      {p.salePrice && <span className="badge badge-sale t-mono-xs">Sale</span>}
                      {p.badge && p.badge !== "Sale" && <span className="badge badge-new t-mono-xs">{p.badge}</span>}
                    </div>
                  )}
                  <WishlistButton slug={p.slug} name={p.name} />
                  <QuickAddButton product={p} />
                </div>
                <Link href={`/products/${p.slug}`} className="meta-link">
                  <div className="meta">
                    <h3 className="name">{p.name}</h3>
                    <div className="row">
                      {p.salePrice ? (
                        <span className="price-group">
                          <span className="price price-sale">{fmtINR(p.salePrice)}</span>
                          <span className="price price-orig">{fmtINR(p.price)}</span>
                        </span>
                      ) : (
                        <span className="price">{fmtINR(p.price)}</span>
                      )}
                      <span className="tag">{p.fabric} · {p.fit}</span>
                    </div>
                  </div>
                </Link>
              </Reveal>
            ))
          )}
        </div>
      </section>
    </>
  );
}

function FilterGroup({ name, values, active, onToggle }: { name: string; values: string[]; active: Set<string>; onToggle: (v: string) => void }) {
  return (
    <div className="filter-group">
      <h4>{name}</h4>
      <div className="filter-chips">
        {values.map(v => (
          <button key={v} className={active.has(v) ? "on" : ""} onClick={() => onToggle(v)}>{v}</button>
        ))}
      </div>
    </div>
  );
}
