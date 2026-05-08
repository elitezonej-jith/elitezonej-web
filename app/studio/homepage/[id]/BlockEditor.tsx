"use client";
import { useState } from "react";
import { saveBlockConfigAction } from "../../actions/homepage";
import ImageUploader from "../../components/ImageUploader";
import { IconPlus, IconTrash } from "../../components/Icons";
import type { HomepageBlockResolved } from "../../../../lib/admin/repos/homepage";

type RC = Record<string, unknown>;

export default function BlockEditor({ block }: { block: HomepageBlockResolved }) {
  const [title, setTitle] = useState(block.title);
  const [kicker, setKicker] = useState(block.kicker);
  const [config, setConfig] = useState<RC>(block.config as RC);

  const update = (next: RC) => setConfig(next);

  return (
    <form action={saveBlockConfigAction} className="stu-form">
      <input type="hidden" name="id" value={block.id} />
      <input type="hidden" name="config_json" value={JSON.stringify(config)} />

      <section className="stu-card">
        <header className="stu-card__head">
          <h3>Section heading</h3>
          <span className="stu-card__head__sub">Used as a hint inside Studio. Some block types display this on the storefront too.</span>
        </header>
        <div className="stu-card__body">
          <div className="stu-row">
            <label className="stu-field">
              <span className="stu-field__label">Title</span>
              <input name="title" value={title} onChange={(e) => setTitle(e.target.value)} className="stu-input" />
            </label>
            <label className="stu-field">
              <span className="stu-field__label">Small kicker</span>
              <input name="kicker" value={kicker} onChange={(e) => setKicker(e.target.value)} className="stu-input" />
            </label>
          </div>
        </div>
      </section>

      <Editor type={block.type} config={config} update={update} />

      <div className="stu-btn-row" style={{ justifyContent: "flex-end" }}>
        <button type="submit" className="stu-btn stu-btn--primary stu-btn--lg">Save section</button>
      </div>
    </form>
  );
}

function Editor({ type, config, update }: { type: string; config: RC; update: (n: RC) => void }) {
  switch (type) {
    case "hero_grid":
      return <TilesEditor name="tiles" config={config} update={update} fields={["kicker","title","body","image","href","cta"]} title="Hero tiles" min={1} max={4} />;
    case "service_cards":
      return <TilesEditor name="cards" config={config} update={update} fields={["kicker","title","body","image","cta","href"]} title="Service cards" min={1} max={4} />;
    case "process_strip":
      return <TilesEditor name="steps" config={config} update={update} fields={["kicker","title","body","image"]} title="Steps" min={1} max={4} />;
    case "trust_strip":
      return <TilesEditor name="items" config={config} update={update} fields={["kicker","label"]} title="Items" min={1} max={6} simple />;
    case "hero_banner":
    case "full_banner":
    case "wedding_editorial":
      return <SingleHeroEditor config={config} update={update} />;
    case "editorial_split":
      return <EditorialSplitEditor config={config} update={update} />;
    case "product_carousel":
      return <ProductCarouselEditor config={config} update={update} />;
    case "bespoke_teaser":
      return <BespokeTeaserEditor config={config} update={update} />;
    case "category_grid":
      return <CategoryGridEditor config={config} update={update} />;
    case "custom_html":
      return <CustomHtmlEditor config={config} update={update} />;
    case "banner_carousel":
      return (
        <section className="stu-card">
          <header className="stu-card__head"><h3>Banner carousel</h3></header>
          <div className="stu-card__body">
            <p style={{ fontSize: 13.5, color: "var(--stu-text-3)" }}>
              This block shows the banners you've published in <strong>Banners</strong>. Manage banners directly there.
            </p>
            <label className="stu-field" style={{ marginTop: 16 }}>
              <span className="stu-field__label">Autoplay (seconds)</span>
              <input type="number" min={2} max={20}
                     value={Number(config.autoplay_seconds ?? 6)}
                     onChange={(e) => update({ ...config, autoplay_seconds: Number(e.target.value) })}
                     className="stu-input" style={{ maxWidth: 120 }} />
            </label>
          </div>
        </section>
      );
    default:
      return null;
  }
}

function TilesEditor({
  name, config, update, fields, title, min = 1, max = 4, simple = false,
}: {
  name: string; config: RC; update: (n: RC) => void;
  fields: string[]; title: string; min?: number; max?: number; simple?: boolean;
}) {
  const tiles = (config[name] as Array<RC>) ?? [];
  const set = (next: Array<RC>) => update({ ...config, [name]: next });
  const add = () => { if (tiles.length < max) set([...tiles, {}]); };
  const remove = (i: number) => { if (tiles.length > min) set(tiles.filter((_, k) => k !== i)); };

  return (
    <section className="stu-card">
      <header className="stu-card__head">
        <h3>{title}</h3>
        <button type="button" className="stu-btn stu-btn--ghost stu-btn--sm" onClick={add} disabled={tiles.length >= max}>
          <IconPlus width={14} height={14}/> Add
        </button>
      </header>
      <div className="stu-card__body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {tiles.map((t, i) => (
          <div key={i} style={{ background: "var(--stu-bg)", padding: 16, borderRadius: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <strong style={{ fontSize: 13 }}>#{i + 1}</strong>
              {tiles.length > min && (
                <button type="button" className="stu-btn stu-btn--ghost stu-btn--sm" onClick={() => remove(i)}>
                  <IconTrash width={14} height={14}/> Remove
                </button>
              )}
            </div>
            {fields.map((f) => (
              <div key={f} style={{ marginBottom: simple ? 8 : 12 }}>
                {f === "image" ? (
                  <ImageField label="Image" value={String(t[f] ?? "")} onChange={(v) => {
                    const n = [...tiles]; n[i] = { ...t, [f]: v }; set(n);
                  }} folder="homepage" />
                ) : (
                  <label className="stu-field">
                    <span className="stu-field__label">{f.charAt(0).toUpperCase() + f.slice(1)}</span>
                    {f === "body" ? (
                      <textarea value={String(t[f] ?? "")} onChange={(e) => {
                        const n = [...tiles]; n[i] = { ...t, [f]: e.target.value }; set(n);
                      }} className="stu-textarea" rows={2} />
                    ) : (
                      <input value={String(t[f] ?? "")} onChange={(e) => {
                        const n = [...tiles]; n[i] = { ...t, [f]: e.target.value }; set(n);
                      }} className="stu-input" />
                    )}
                  </label>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

function SingleHeroEditor({ config, update }: { config: RC; update: (n: RC) => void }) {
  const cta = (config.cta as RC) ?? { label: "Shop now", href: "" };
  return (
    <section className="stu-card">
      <header className="stu-card__head"><h3>Banner content</h3></header>
      <div className="stu-card__body">
        <ImageField label="Background image" value={String(config.image ?? "")} onChange={(v) => update({ ...config, image: v })} folder="homepage" />
        <div className="stu-row" style={{ marginTop: 16 }}>
          <label className="stu-field">
            <span className="stu-field__label">Headline</span>
            <input value={String(config.headline ?? "")} onChange={(e) => update({ ...config, headline: e.target.value })} className="stu-input" />
          </label>
          <label className="stu-field">
            <span className="stu-field__label">Body</span>
            <input value={String(config.body ?? "")} onChange={(e) => update({ ...config, body: e.target.value })} className="stu-input" />
          </label>
        </div>
        <div className="stu-row" style={{ marginTop: 16 }}>
          <label className="stu-field">
            <span className="stu-field__label">Button label</span>
            <input value={String(cta.label ?? "")} onChange={(e) => update({ ...config, cta: { ...cta, label: e.target.value } })} className="stu-input" />
          </label>
          <label className="stu-field">
            <span className="stu-field__label">Button link</span>
            <input value={String(cta.href ?? "")} onChange={(e) => update({ ...config, cta: { ...cta, href: e.target.value } })} className="stu-input" />
          </label>
        </div>
      </div>
    </section>
  );
}

function EditorialSplitEditor({ config, update }: { config: RC; update: (n: RC) => void }) {
  const link = (config.link as RC) ?? {};
  return (
    <section className="stu-card">
      <header className="stu-card__head"><h3>Editorial split</h3></header>
      <div className="stu-card__body">
        <ImageField label="Image" value={String(config.image ?? "")} onChange={(v) => update({ ...config, image: v })} folder="homepage" />
        <div className="stu-row" style={{ marginTop: 16 }}>
          <label className="stu-field">
            <span className="stu-field__label">Headline (HTML allowed)</span>
            <input value={String(config.headline ?? "")} onChange={(e) => update({ ...config, headline: e.target.value })} className="stu-input" />
          </label>
          <label className="stu-field">
            <span className="stu-field__label">Image side</span>
            <select value={String(config.align ?? "left")} onChange={(e) => update({ ...config, align: e.target.value })} className="stu-select">
              <option value="left">Left</option>
              <option value="right">Right</option>
            </select>
          </label>
        </div>
        <label className="stu-field" style={{ marginTop: 16 }}>
          <span className="stu-field__label">Body</span>
          <textarea value={String(config.body ?? "")} onChange={(e) => update({ ...config, body: e.target.value })} className="stu-textarea" rows={3} />
        </label>
        <div className="stu-row" style={{ marginTop: 16 }}>
          <label className="stu-field">
            <span className="stu-field__label">Link text</span>
            <input value={String(link.label ?? "")} onChange={(e) => update({ ...config, link: { ...link, label: e.target.value } })} className="stu-input" />
          </label>
          <label className="stu-field">
            <span className="stu-field__label">Link URL</span>
            <input value={String(link.href ?? "")} onChange={(e) => update({ ...config, link: { ...link, href: e.target.value } })} className="stu-input" />
          </label>
        </div>
      </div>
    </section>
  );
}

function ProductCarouselEditor({ config, update }: { config: RC; update: (n: RC) => void }) {
  const filter = (config.filter as RC) ?? {};
  const cta = (config.cta as RC) ?? {};
  return (
    <section className="stu-card">
      <header className="stu-card__head"><h3>Product carousel</h3></header>
      <div className="stu-card__body">
        <p style={{ fontSize: 13.5, color: "var(--stu-text-3)", marginBottom: 14 }}>
          The carousel pulls products from your catalog using the filter below.
        </p>
        <div className="stu-row--3">
          <label className="stu-field">
            <span className="stu-field__label">Type</span>
            <select value={String(filter.kind ?? "")} onChange={(e) => update({ ...config, filter: { ...filter, kind: e.target.value } })} className="stu-select">
              <option value="">Any</option>
              <option value="tailored">Tailored</option>
              <option value="fabric">Fabrics</option>
            </select>
          </label>
          <label className="stu-field">
            <span className="stu-field__label">Audience</span>
            <select value={String(filter.gender ?? "")} onChange={(e) => update({ ...config, filter: { ...filter, gender: e.target.value } })} className="stu-select">
              <option value="">Any</option>
              <option value="men">Men</option>
              <option value="women">Women</option>
              <option value="unisex">Unisex</option>
            </select>
          </label>
          <label className="stu-field">
            <span className="stu-field__label">Limit</span>
            <input type="number" min={1} max={24} value={Number(filter.limit ?? 6)}
                   onChange={(e) => update({ ...config, filter: { ...filter, limit: Number(e.target.value) } })}
                   className="stu-input" />
          </label>
        </div>
        <div className="stu-row" style={{ marginTop: 16 }}>
          <label className="stu-field">
            <span className="stu-field__label">Category (optional)</span>
            <input value={String(filter.category ?? "")} onChange={(e) => update({ ...config, filter: { ...filter, category: e.target.value } })}
                   className="stu-input" placeholder="suits, festive…" />
          </label>
          <label className="stu-field">
            <span className="stu-field__label">Show featured-only?</span>
            <select value={String(filter.featured ? "yes" : "no")} onChange={(e) => update({ ...config, filter: { ...filter, featured: e.target.value === "yes" } })} className="stu-select">
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </label>
        </div>
        <div className="stu-row" style={{ marginTop: 16 }}>
          <label className="stu-field">
            <span className="stu-field__label">CTA label</span>
            <input value={String(cta.label ?? "")} onChange={(e) => update({ ...config, cta: { ...cta, label: e.target.value } })} className="stu-input" />
          </label>
          <label className="stu-field">
            <span className="stu-field__label">CTA link</span>
            <input value={String(cta.href ?? "")} onChange={(e) => update({ ...config, cta: { ...cta, href: e.target.value } })} className="stu-input" />
          </label>
        </div>
      </div>
    </section>
  );
}

function BespokeTeaserEditor({ config, update }: { config: RC; update: (n: RC) => void }) {
  const cta = (config.cta as RC) ?? {};
  return (
    <section className="stu-card">
      <header className="stu-card__head"><h3>Bespoke teaser</h3></header>
      <div className="stu-card__body">
        <label className="stu-field">
          <span className="stu-field__label">Headline</span>
          <input value={String(config.headline ?? "")} onChange={(e) => update({ ...config, headline: e.target.value })} className="stu-input" />
        </label>
        <label className="stu-field" style={{ marginTop: 16 }}>
          <span className="stu-field__label">Body</span>
          <textarea value={String(config.body ?? "")} onChange={(e) => update({ ...config, body: e.target.value })} className="stu-textarea" rows={3} />
        </label>
        <div className="stu-row" style={{ marginTop: 16 }}>
          <label className="stu-field">
            <span className="stu-field__label">CTA label</span>
            <input value={String(cta.label ?? "")} onChange={(e) => update({ ...config, cta: { ...cta, label: e.target.value } })} className="stu-input" />
          </label>
          <label className="stu-field">
            <span className="stu-field__label">CTA link</span>
            <input value={String(cta.href ?? "")} onChange={(e) => update({ ...config, cta: { ...cta, href: e.target.value } })} className="stu-input" />
          </label>
        </div>
      </div>
    </section>
  );
}

function CategoryGridEditor({ config, update }: { config: RC; update: (n: RC) => void }) {
  const cats = (config.categories as Array<RC>) ?? [];
  const set = (next: Array<RC>) => update({ ...config, categories: next });
  return (
    <section className="stu-card">
      <header className="stu-card__head">
        <h3>Category tiles</h3>
        <button type="button" className="stu-btn stu-btn--ghost stu-btn--sm" onClick={() => set([...cats, { name: "", href: "", image: "" }])}>
          <IconPlus width={14} height={14}/> Add tile
        </button>
      </header>
      <div className="stu-card__body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {cats.map((c, i) => (
          <div key={i} style={{ background: "var(--stu-bg)", padding: 16, borderRadius: 10 }}>
            <ImageField label="Image" value={String(c.image ?? "")} folder="homepage"
                        onChange={(v) => { const n = [...cats]; n[i] = { ...c, image: v }; set(n); }} />
            <div className="stu-row" style={{ marginTop: 12 }}>
              <label className="stu-field"><span className="stu-field__label">Name</span>
                <input value={String(c.name ?? "")} onChange={(e) => { const n = [...cats]; n[i] = { ...c, name: e.target.value }; set(n); }} className="stu-input" />
              </label>
              <label className="stu-field"><span className="stu-field__label">Link</span>
                <input value={String(c.href ?? "")} onChange={(e) => { const n = [...cats]; n[i] = { ...c, href: e.target.value }; set(n); }} className="stu-input" />
              </label>
            </div>
            <button type="button" className="stu-btn stu-btn--ghost stu-btn--sm" style={{ marginTop: 12 }}
                    onClick={() => set(cats.filter((_, k) => k !== i))}>
              <IconTrash width={14} height={14}/> Remove
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

function CustomHtmlEditor({ config, update }: { config: RC; update: (n: RC) => void }) {
  return (
    <section className="stu-card">
      <header className="stu-card__head"><h3>Custom HTML</h3>
        <span className="stu-card__head__sub">Power-user only — write raw markup. Keep it simple.</span>
      </header>
      <div className="stu-card__body">
        <textarea value={String(config.html ?? "")} onChange={(e) => update({ ...config, html: e.target.value })}
                  className="stu-textarea" rows={10} style={{ fontFamily: "ui-monospace, monospace", fontSize: 12.5 }} />
      </div>
    </section>
  );
}

function ImageField({ label, value, onChange, folder }: { label: string; value: string; onChange: (v: string) => void; folder: string }) {
  return (
    <div>
      <span className="stu-field__label" style={{ display: "block", marginBottom: 6 }}>{label}</span>
      {value ? (
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" style={{ width: 120, height: 80, objectFit: "cover", borderRadius: 8, border: "1px solid var(--stu-border)" }} />
          <button type="button" className="stu-btn stu-btn--ghost stu-btn--sm" onClick={() => onChange("")}>Remove</button>
        </div>
      ) : (
        <ImageUploader folder={folder} multiple={false} onUploaded={({ path }) => onChange(path)} />
      )}
    </div>
  );
}
