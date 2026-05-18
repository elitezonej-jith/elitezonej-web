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
    case "announce_bar":
      return <AnnounceBarEditor config={config} update={update} />;
    case "promo_modal":
      return <PromoModalEditor config={config} update={update} />;
    case "hero_grid":
      return <TilesEditor name="tiles" config={config} update={update} fields={["eyebrow","title","sub","cta","href","img","pos","veil"]} imageKeys={["img"]} title="Hero tiles" min={1} max={4} />;
    case "service_cards":
      return <ServiceCardsEditor config={config} update={update} />;
    case "process_strip":
      return <ProcessStripEditor config={config} update={update} />;
    case "trust_strip":
      return (
        <section className="stu-card">
          <header className="stu-card__head"><h3>Trust strip</h3></header>
          <div className="stu-card__body">
            <p style={{ fontSize: 13.5, color: "var(--stu-text-3)" }}>
              The trust &amp; support strip (duties, free delivery, pay later, helpline) is fixed in code.
              This block controls whether it shows and where it sits on the page — use the list view to
              reorder or hide it.
            </p>
          </div>
        </section>
      );
    case "hero_banner":
    case "full_banner":
      return <CollectionBannerEditor config={config} update={update} />;
    case "wedding_editorial":
      return <WeddingEditorialEditor config={config} update={update} />;
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
              This block shows the banners you&apos;ve published in <strong>Banners</strong>. Manage banners directly there.
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

function Text({ label, value, onChange, area = false, hint }: { label: string; value: string; onChange: (v: string) => void; area?: boolean; hint?: string }) {
  return (
    <label className="stu-field">
      <span className="stu-field__label">{label}</span>
      {area ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} className="stu-textarea" rows={3} />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} className="stu-input" />
      )}
      {hint ? <span style={{ fontSize: 12, color: "var(--stu-text-3)", marginTop: 4 }}>{hint}</span> : null}
    </label>
  );
}

function TilesEditor({
  name, config, update, fields, title, min = 1, max = 4, simple = false, imageKeys = ["image"],
}: {
  name: string; config: RC; update: (n: RC) => void;
  fields: string[]; title: string; min?: number; max?: number; simple?: boolean; imageKeys?: string[];
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
                {imageKeys.includes(f) ? (
                  <ImageField label={f.charAt(0).toUpperCase() + f.slice(1)} value={String(t[f] ?? "")} onChange={(v) => {
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

function AnnounceBarEditor({ config, update }: { config: RC; update: (n: RC) => void }) {
  return (
    <>
      <section className="stu-card">
        <header className="stu-card__head"><h3>Announce bar</h3></header>
        <div className="stu-card__body">
          <Text label="Accessible label (screen-reader summary)" value={String(config.ariaLabel ?? "")}
                onChange={(v) => update({ ...config, ariaLabel: v })} />
        </div>
      </section>
      <TilesEditor name="items" config={config} update={update} fields={["text","accent","suffix"]} title="Ticker items" min={1} max={8} simple />
    </>
  );
}

function PromoModalEditor({ config, update }: { config: RC; update: (n: RC) => void }) {
  const countries = (config.countries as unknown[] | undefined)?.map(String) ?? [];
  return (
    <section className="stu-card">
      <header className="stu-card__head"><h3>Promo modal</h3>
        <span className="stu-card__head__sub">Use a new line in Heading/Deck where the original showed a line break. Success body may include {"{email}"}.</span>
      </header>
      <div className="stu-card__body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Text label="Sticker label" value={String(config.stickerLabel ?? "")} onChange={(v) => update({ ...config, stickerLabel: v })} />
        <Text label="Heading" value={String(config.heading ?? "")} onChange={(v) => update({ ...config, heading: v })} area />
        <Text label="Deck" value={String(config.deck ?? "")} onChange={(v) => update({ ...config, deck: v })} area />
        <Text label="Submit button label" value={String(config.submitLabel ?? "")} onChange={(v) => update({ ...config, submitLabel: v })} />
        <Text label="Fine print" value={String(config.finePrint ?? "")} onChange={(v) => update({ ...config, finePrint: v })} area />
        <Text label="Success heading" value={String(config.successHeading ?? "")} onChange={(v) => update({ ...config, successHeading: v })} />
        <Text label="Success body" value={String(config.successBody ?? "")} onChange={(v) => update({ ...config, successBody: v })} area hint="Include {email} where the subscriber's email should appear." />
        <Text label="Countries (one per line)" value={countries.join("\n")}
              onChange={(v) => update({ ...config, countries: v.split("\n").map((s) => s.trim()).filter(Boolean) })} area />
      </div>
    </section>
  );
}

function ServiceCardsEditor({ config, update }: { config: RC; update: (n: RC) => void }) {
  return (
    <>
      <section className="stu-card">
        <header className="stu-card__head"><h3>Section header</h3></header>
        <div className="stu-card__body">
          <div className="stu-row">
            <Text label="Heading" value={String(config.heading ?? "")} onChange={(v) => update({ ...config, heading: v })} />
            <Text label="Meta label" value={String(config.meta ?? "")} onChange={(v) => update({ ...config, meta: v })} />
          </div>
        </div>
      </section>
      <TilesEditor name="items" config={config} update={update}
                   fields={["eyebrow","title","body","cta","href","photo","alt"]}
                   title="Service cards" min={1} max={4} />
    </>
  );
}

function ProcessStripEditor({ config, update }: { config: RC; update: (n: RC) => void }) {
  return (
    <>
      <section className="stu-card">
        <header className="stu-card__head"><h3>Process strip</h3>
          <span className="stu-card__head__sub">Title renders as: Pre + emphasised + Post (e.g. &quot;How it&apos;s &quot; / &quot;made&quot; / &quot;.&quot;).</span>
        </header>
        <div className="stu-card__body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="stu-row--3">
            <Text label="Title (pre)" value={String(config.titlePre ?? "")} onChange={(v) => update({ ...config, titlePre: v })} />
            <Text label="Title (emphasis)" value={String(config.titleEm ?? "")} onChange={(v) => update({ ...config, titleEm: v })} />
            <Text label="Title (post)" value={String(config.titlePost ?? "")} onChange={(v) => update({ ...config, titlePost: v })} />
          </div>
          <div className="stu-row">
            <Text label="Kicker" value={String(config.kicker ?? "")} onChange={(v) => update({ ...config, kicker: v })} />
            <Text label="Drag hint" value={String(config.hint ?? "")} onChange={(v) => update({ ...config, hint: v })} />
          </div>
          <Text label="Footer note" value={String(config.footText ?? "")} onChange={(v) => update({ ...config, footText: v })} />
          <div className="stu-row">
            <Text label="Button label" value={String(config.ctaLabel ?? "")} onChange={(v) => update({ ...config, ctaLabel: v })} />
            <Text label="Button link" value={String(config.ctaHref ?? "")} onChange={(v) => update({ ...config, ctaHref: v })} />
          </div>
          <Text label="Accessible label" value={String(config.ariaLabel ?? "")} onChange={(v) => update({ ...config, ariaLabel: v })} />
        </div>
      </section>
      <TilesEditor name="panes" config={config} update={update}
                   fields={["photoClass","photoAria","step","title","body"]}
                   title="Steps" min={1} max={4} />
    </>
  );
}

function CollectionBannerEditor({ config, update }: { config: RC; update: (n: RC) => void }) {
  return (
    <section className="stu-card">
      <header className="stu-card__head"><h3>Full-width banner</h3>
        <span className="stu-card__head__sub">Title renders as Title + emphasised suffix (e.g. &quot;Women&apos;s Collection&quot; / &quot;.&quot;).</span>
      </header>
      <div className="stu-card__body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <ImageField label="Background image" value={String(config.image ?? "")} onChange={(v) => update({ ...config, image: v })} folder="homepage" />
        <div className="stu-row">
          <Text label="Eyebrow" value={String(config.eyebrow ?? "")} onChange={(v) => update({ ...config, eyebrow: v })} />
          <Text label="Image alt text" value={String(config.imgAria ?? "")} onChange={(v) => update({ ...config, imgAria: v })} />
        </div>
        <div className="stu-row">
          <Text label="Title" value={String(config.title ?? "")} onChange={(v) => update({ ...config, title: v })} />
          <Text label="Title (emphasised suffix)" value={String(config.titleEm ?? "")} onChange={(v) => update({ ...config, titleEm: v })} />
        </div>
        <div className="stu-row">
          <Text label="Button label" value={String(config.ctaLabel ?? "")} onChange={(v) => update({ ...config, ctaLabel: v })} />
          <Text label="Link URL" value={String(config.href ?? "")} onChange={(v) => update({ ...config, href: v })} />
        </div>
        <Text label="Accessible label (whole banner)" value={String(config.ariaLabel ?? "")} onChange={(v) => update({ ...config, ariaLabel: v })} />
      </div>
    </section>
  );
}

function WeddingEditorialEditor({ config, update }: { config: RC; update: (n: RC) => void }) {
  const paras = (config.paras as unknown[] | undefined)?.map(String) ?? [];
  return (
    <section className="stu-card">
      <header className="stu-card__head"><h3>Wedding editorial</h3>
        <span className="stu-card__head__sub">Headline renders as Pre + emphasised + Post.</span>
      </header>
      <div className="stu-card__body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Text label="Index label" value={String(config.ix ?? "")} onChange={(v) => update({ ...config, ix: v })} />
        <div className="stu-row--3">
          <Text label="Headline (pre)" value={String(config.headlinePre ?? "")} onChange={(v) => update({ ...config, headlinePre: v })} />
          <Text label="Headline (emphasis)" value={String(config.headlineEm ?? "")} onChange={(v) => update({ ...config, headlineEm: v })} />
          <Text label="Headline (post)" value={String(config.headlinePost ?? "")} onChange={(v) => update({ ...config, headlinePost: v })} />
        </div>
        <Text label="Paragraphs (one per line)" value={paras.join("\n")}
              onChange={(v) => update({ ...config, paras: v.split("\n").filter((s) => s.trim().length > 0) })} area />
        <div className="stu-row">
          <Text label="Button label" value={String(config.ctaLabel ?? "")} onChange={(v) => update({ ...config, ctaLabel: v })} />
          <Text label="Button link" value={String(config.ctaHref ?? "")} onChange={(v) => update({ ...config, ctaHref: v })} />
        </div>
        <div className="stu-row">
          <Text label="Signed" value={String(config.signed ?? "")} onChange={(v) => update({ ...config, signed: v })} />
          <Text label="Image alt text" value={String(config.imgAria ?? "")} onChange={(v) => update({ ...config, imgAria: v })} />
        </div>
      </div>
    </section>
  );
}

function EditorialSplitEditor({ config, update }: { config: RC; update: (n: RC) => void }) {
  const filter = (config.filter as RC) ?? {};
  return (
    <section className="stu-card">
      <header className="stu-card__head"><h3>Editorial split</h3></header>
      <div className="stu-card__body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <ImageField label="Image" value={String(config.image ?? "")} onChange={(v) => update({ ...config, image: v })} folder="homepage" />
        <div className="stu-row">
          <Text label="Overlay title" value={String(config.title ?? "")} onChange={(v) => update({ ...config, title: v })} />
          <label className="stu-field">
            <span className="stu-field__label">Image side</span>
            <select value={String(config.imageSide ?? "left")} onChange={(e) => update({ ...config, imageSide: e.target.value })} className="stu-select">
              <option value="left">Left</option>
              <option value="right">Right</option>
            </select>
          </label>
        </div>
        <Text label="Image alt text" value={String(config.imageAlt ?? "")} onChange={(v) => update({ ...config, imageAlt: v })} />
        <div className="stu-row">
          <Text label="Button label" value={String(config.ctaLabel ?? "")} onChange={(v) => update({ ...config, ctaLabel: v })} />
          <Text label="Button link" value={String(config.ctaHref ?? "")} onChange={(v) => update({ ...config, ctaHref: v })} />
        </div>
        <div className="stu-row--3">
          <label className="stu-field">
            <span className="stu-field__label">Products: audience</span>
            <select value={String(filter.gender ?? "")} onChange={(e) => update({ ...config, filter: { ...filter, gender: e.target.value } })} className="stu-select">
              <option value="">Any</option>
              <option value="men">Men</option>
              <option value="women">Women</option>
              <option value="unisex">Unisex</option>
            </select>
          </label>
          <Text label="Products: limit" value={String(filter.limit ?? 6)} onChange={(v) => update({ ...config, filter: { ...filter, limit: Number(v) || 6 } })} />
          <span />
        </div>
      </div>
    </section>
  );
}

function ProductCarouselEditor({ config, update }: { config: RC; update: (n: RC) => void }) {
  const filter = (config.filter as RC) ?? {};
  return (
    <section className="stu-card">
      <header className="stu-card__head"><h3>Product carousel</h3></header>
      <div className="stu-card__body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <p style={{ fontSize: 13.5, color: "var(--stu-text-3)" }}>
          The heading uses this section&apos;s <strong>Title</strong> above. Products come from the catalog using the filter below.
        </p>
        <div className="stu-row--3">
          <label className="stu-field">
            <span className="stu-field__label">Audience</span>
            <select value={String(filter.gender ?? "")} onChange={(e) => update({ ...config, filter: { ...filter, gender: e.target.value } })} className="stu-select">
              <option value="">Any</option>
              <option value="men">Men</option>
              <option value="women">Women</option>
              <option value="unisex">Unisex</option>
            </select>
          </label>
          <Text label="Category (optional)" value={String(filter.category ?? "")} onChange={(v) => update({ ...config, filter: { ...filter, category: v } })} />
          <Text label="Limit" value={String(filter.limit ?? 6)} onChange={(v) => update({ ...config, filter: { ...filter, limit: Number(v) || 6 } })} />
        </div>
        <div className="stu-row--3">
          <Text label="CTA label" value={String(config.ctaLabel ?? "")} onChange={(v) => update({ ...config, ctaLabel: v })} />
          <Text label="CTA link" value={String(config.ctaHref ?? "")} onChange={(v) => update({ ...config, ctaHref: v })} />
          <label className="stu-field">
            <span className="stu-field__label">Heading side</span>
            <select value={String(config.headingSide ?? "left")} onChange={(e) => update({ ...config, headingSide: e.target.value })} className="stu-select">
              <option value="left">Left</option>
              <option value="right">Right</option>
            </select>
          </label>
        </div>
      </div>
    </section>
  );
}

function BespokeTeaserEditor({ config, update }: { config: RC; update: (n: RC) => void }) {
  return (
    <section className="stu-card">
      <header className="stu-card__head"><h3>Bespoke teaser</h3>
        <span className="stu-card__head__sub">Headline renders as Pre + emphasised.</span>
      </header>
      <div className="stu-card__body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Text label="Index label" value={String(config.ix ?? "")} onChange={(v) => update({ ...config, ix: v })} />
        <div className="stu-row">
          <Text label="Headline (pre)" value={String(config.headlinePre ?? "")} onChange={(v) => update({ ...config, headlinePre: v })} />
          <Text label="Headline (emphasis)" value={String(config.headlineEm ?? "")} onChange={(v) => update({ ...config, headlineEm: v })} />
        </div>
        <Text label="Body" value={String(config.body ?? "")} onChange={(v) => update({ ...config, body: v })} area />
        <div className="stu-row">
          <Text label="CTA label" value={String(config.ctaLabel ?? "")} onChange={(v) => update({ ...config, ctaLabel: v })} />
          <Text label="CTA link" value={String(config.ctaHref ?? "")} onChange={(v) => update({ ...config, ctaHref: v })} />
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
