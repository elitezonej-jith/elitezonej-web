"use client";
import { useActionState, useState } from "react";
import { saveProductAction, type ProductSaveState } from "../../actions/products";
import Switch from "../../components/Switch";
import ImageUploader from "../../components/ImageUploader";
import { useFormGuard } from "../../components/useFormGuard";
import CategoryPicker from "./CategoryPicker";
import FilterAttributes from "./FilterAttributes";
import SizeStockEditor, { type SizeStockRow } from "./SizeStockEditor";
import FabricStockEditor, { type ColourwayRow } from "./FabricStockEditor";
import FabricMetaFields from "./FabricMetaFields";
import type { Product } from "../../../../lib/admin/types";
import type { ProductMeta } from "../../../../lib/admin/repos/product-meta";

type Cat = { id: number; name: string; slug: string; parent_id: number | null };

const initial: ProductSaveState = {};

export default function ProductForm({
  mode, product, meta, categories = [],
  inventory = [], fabricMeta = null, fabricColours = [],
}: {
  mode: "new" | "edit";
  product?: Product;
  meta?: ProductMeta;
  categories?: Cat[];
  inventory?: SizeStockRow[];
  fabricMeta?: { width_inches: number; gsm: number; composition: string; care: string; origin: string } | null;
  fabricColours?: ColourwayRow[];
}) {
  const [state, action, pending] = useActionState(saveProductAction, initial);
  const [name, setName] = useState(product?.name ?? "");
  const [kind, setKind] = useState<"tailored" | "fabric">(product?.kind ?? "tailored");
  const [seoOpen, setSeoOpen] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [sizeStockRows, setSizeStockRows] = useState<SizeStockRow[]>(inventory);
  const [fabricColourRows, setFabricColourRows] = useState<ColourwayRow[]>(fabricColours);
  const { formRef, markDirty } = useFormGuard();
  const slugDerived = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const features = product?.features?.join("\n") ?? "";
  const spec = product?.spec?.map(([k, v]) => `${k}: ${v}`).join("\n") ?? "";

  return (
    <form ref={formRef} action={action} className="stu-form" onChange={markDirty}>
      {/* Hidden slug - auto-generated or preserved */}
      <input type="hidden" name="slug" value={product?.slug ?? slugDerived} />
      {/* Hidden image paths for new product */}
      {images.map((img, i) => <input key={i} type="hidden" name="images" value={img} />)}

      <div className="stu-cols">
        {/* MAIN COLUMN */}
        <div className="stu-stack">

          {/* Basics */}
          <section className="stu-card">
            <header className="stu-card__head"><h3>Basic info</h3></header>
            <div className="stu-card__body">
              <label className="stu-field">
                <span className="stu-field__label">Product name</span>
                <input name="name" value={name} onChange={(e) => setName(e.target.value)}
                       required className="stu-input" placeholder="The Heritage Three-Piece" />
              </label>
              {mode === "edit" && (
                <p className="stu-hint" style={{ marginTop: 4, fontFamily: "ui-monospace, monospace", fontSize: 12 }}>
                  URL: /products/{product?.slug}
                </p>
              )}

              <label className="stu-field" style={{ marginTop: 16 }}>
                <span className="stu-field__label">One-line summary</span>
                <input name="line" defaultValue={product?.line ?? ""} className="stu-input"
                       placeholder="A tailored three-piece in 280gsm Italian wool" />
              </label>

              <label className="stu-field" style={{ marginTop: 16 }}>
                <span className="stu-field__label">Short description <span className="stu-field__hint">(shown on product cards)</span></span>
                <textarea name="short_description" defaultValue={meta?.short_description ?? ""} className="stu-textarea" rows={2} />
              </label>

              <label className="stu-field" style={{ marginTop: 16 }}>
                <span className="stu-field__label">Full description</span>
                <textarea name="long_description" defaultValue={meta?.long_description ?? product?.description ?? ""}
                          className="stu-textarea" rows={6}
                          placeholder="Tell the customer everything about this piece — fabric, fit, story." />
              </label>
            </div>
          </section>

          {/* Images (new product only - edit uses ProductImageManager) */}
          {mode === "new" && (
            <section className="stu-card">
              <header className="stu-card__head"><h3>Product images</h3></header>
              <div className="stu-card__body">
                {images.length > 0 && (
                  <div className="pf-images">
                    {images.map((img, i) => (
                      <div key={i} className="pf-images__item">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img} alt="" className="pf-images__thumb" />
                        <button type="button" className="pf-images__remove" onClick={() => setImages(prev => prev.filter((_, j) => j !== i))}>×</button>
                      </div>
                    ))}
                  </div>
                )}
                <ImageUploader
                  folder="products"
                  multiple={true}
                  aspect={900 / 1200}
                  onUploaded={({ path }) => setImages(prev => [...prev, path])}
                  hint="Portrait 3:4 ratio, 900×1200px ideal. First image becomes the thumbnail."
                />
              </div>
            </section>
          )}

          {/* Pricing */}
          <section className="stu-card">
            <header className="stu-card__head"><h3>Pricing</h3></header>
            <div className="stu-card__body">
              <div className="stu-row--3">
                <label className="stu-field">
                  <span className="stu-field__label">Price · ₹</span>
                  <input name="price" type="number" min={0} step={1} required defaultValue={product?.price ?? ""}
                         className="stu-input" />
                </label>
                <label className="stu-field">
                  <span className="stu-field__label">Sale price · ₹ <span className="stu-field__hint">(blank = no sale)</span></span>
                  <input name="sale_price" type="number" min={0} step={1} defaultValue={product?.sale_price ?? ""} className="stu-input" />
                </label>
                <label className="stu-field">
                  <span className="stu-field__label">Badge <span className="stu-field__hint">(optional)</span></span>
                  <select name="badge" defaultValue={product?.badge ?? ""} className="stu-select">
                    <option value="">None</option>
                    <option value="New">New</option>
                    <option value="Sale">Sale</option>
                    <option value="Bespoke">Bespoke</option>
                    <option value="Festive">Festive</option>
                  </select>
                </label>
              </div>
              <div className="stu-row--3" style={{ marginTop: 16 }}>
                <label className="stu-field">
                  <span className="stu-field__label">Delivery · min days</span>
                  <input name="delivery_min_days" type="number" min={1} max={60} step={1} defaultValue={product?.delivery_min_days ?? ""} className="stu-input" placeholder="e.g. 5" />
                </label>
                <label className="stu-field">
                  <span className="stu-field__label">Delivery · max days</span>
                  <input name="delivery_max_days" type="number" min={1} max={60} step={1} defaultValue={product?.delivery_max_days ?? ""} className="stu-input" placeholder="e.g. 7" />
                </label>
                <div className="stu-field">
                  <span className="stu-field__label">&nbsp;</span>
                  <span className="stu-field__hint">Leave blank to use the global default from Settings.</span>
                </div>
              </div>
            </div>
          </section>

          {/* CONDITIONAL: Fabric vs Tailored stock management */}
          {kind === "fabric" ? (
            <>
              {/* Fabric specifications */}
              <FabricMetaFields meta={fabricMeta} />

              {/* Colourway stock */}
              <section className="stu-card">
                <header className="stu-card__head"><h3>Colourway stock</h3></header>
                <div className="stu-card__body">
                  <input type="hidden" name="fabric_colours_json" value={JSON.stringify(fabricColourRows.filter(r => r.name.trim()))} />
                  <input type="hidden" name="sizes" value="" />
                  <input type="hidden" name="inventory_json" value="[]" />

                  <FabricStockEditor
                    initial={fabricColours}
                    slug={product?.slug ?? slugDerived}
                    onChange={(rows) => { setFabricColourRows(rows); markDirty(); }}
                  />
                </div>
              </section>

              {/* Details (no size guide for fabrics) */}
              <section className="stu-card">
                <header className="stu-card__head"><h3>Details</h3></header>
                <div className="stu-card__body">
                  <label className="stu-field">
                    <span className="stu-field__label">Highlights <span className="stu-field__hint">(bullet points, one per line)</span></span>
                    <textarea name="features" defaultValue={features} className="stu-textarea" rows={5}
                              placeholder={"Super 120s yarn count\nNatural stretch\nWrinkle-resistant finish"} />
                  </label>
                  <label className="stu-field" style={{ marginTop: 16 }}>
                    <span className="stu-field__label">Specifications <span className="stu-field__hint">(one per line: Label: Value)</span></span>
                    <textarea name="spec" defaultValue={spec} className="stu-textarea" rows={5}
                              placeholder={"Weave: Twill\nFinish: Soft hand\nSuitable for: Suits, Blazers"} />
                  </label>
                  <input type="hidden" name="size_guide" value="" />
                </div>
              </section>
            </>
          ) : (
            <>
              {/* Sizes & stock (tailored products) */}
              <section className="stu-card">
                <header className="stu-card__head"><h3>Sizes &amp; stock</h3></header>
                <div className="stu-card__body">
                  <input type="hidden" name="sizes" value={sizeStockRows.map(r => r.size).filter(Boolean).join("\n")} />
                  <input type="hidden" name="inventory_json" value={JSON.stringify(sizeStockRows.filter(r => r.size.trim()))} />
                  <input type="hidden" name="fabric_colours_json" value="[]" />

                  <SizeStockEditor
                    initial={inventory}
                    onChange={(rows) => { setSizeStockRows(rows); markDirty(); }}
                  />
                </div>
              </section>

              {/* Details (tailored) */}
              <section className="stu-card">
                <header className="stu-card__head"><h3>Details</h3></header>
                <div className="stu-card__body">
                  <label className="stu-field">
                    <span className="stu-field__label">Highlights <span className="stu-field__hint">(bullet points, one per line)</span></span>
                    <textarea name="features" defaultValue={features} className="stu-textarea" rows={5}
                              placeholder={"Half-canvas construction\nHand-padded lapels\nSide adjusters"} />
                  </label>
                  <label className="stu-field" style={{ marginTop: 16 }}>
                    <span className="stu-field__label">Specifications <span className="stu-field__hint">(one per line: Label: Value)</span></span>
                    <textarea name="spec" defaultValue={spec} className="stu-textarea" rows={5}
                              placeholder={"Cloth: Super 120s pure wool\nWeight: 280 gsm\nMill: Vitale Barberis Canonico"} />
                  </label>
                  <label className="stu-field" style={{ marginTop: 16 }}>
                    <span className="stu-field__label">Size guide <span className="stu-field__hint">(leave blank to hide)</span></span>
                    <textarea name="size_guide" defaultValue={product?.size_guide ?? ""} className="stu-textarea" rows={4}
                              placeholder={"Chest 38: 96 cm\nChest 40: 101 cm"} />
                  </label>
                </div>
              </section>
            </>
          )}

          {/* Filter Attributes - multi-select checkboxes */}
          <FilterAttributes
            categories={categories}
            initialCategory={product?.category || undefined}
            initialSub={product?.sub || undefined}
            productSlug={product?.slug}
          />

          {/* SEO - collapsed by default */}
          <section className="stu-card">
            <header className="stu-card__head stu-card__head--toggle" onClick={() => setSeoOpen(!seoOpen)} style={{ cursor: "pointer" }}>
              <h3>Advanced: Search engine</h3>
              <span style={{ fontSize: 12, color: "var(--stu-muted)" }}>{seoOpen ? "▾ Hide" : "▸ Show"}</span>
            </header>
            {seoOpen && (
              <div className="stu-card__body">
                <label className="stu-field">
                  <span className="stu-field__label">Page title (for Google)</span>
                  <input name="meta_title" defaultValue={meta?.meta_title ?? ""} className="stu-input"
                         maxLength={120} placeholder={name || "Product name appears here"} />
                </label>
                <label className="stu-field" style={{ marginTop: 12 }}>
                  <span className="stu-field__label">Page description (for Google)</span>
                  <textarea name="meta_description" defaultValue={meta?.meta_description ?? ""} className="stu-textarea" rows={2}
                            maxLength={240} placeholder="One or two sentences shown in search results." />
                </label>
                <label className="stu-field" style={{ marginTop: 12 }}>
                  <span className="stu-field__label">Share image URL</span>
                  <input name="og_image_path" defaultValue={meta?.og_image_path ?? ""} className="stu-input" />
                </label>
              </div>
            )}
          </section>
        </div>

        {/* SIDE COLUMN */}
        <div className="stu-stack">
          <section className="stu-card">
            <header className="stu-card__head"><h3>Visibility</h3></header>
            <div className="stu-card__body" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <label className="stu-field">
                <span className="stu-field__label">Status</span>
                <select name="status" defaultValue={product?.status ?? "draft"} className="stu-select">
                  <option value="active">Active — live on store</option>
                  <option value="draft">Draft — hidden</option>
                  <option value="archived">Archived</option>
                </select>
              </label>
              <Switch name="is_featured" label="Featured product" hint="Shown in 'Featured' sections."
                      defaultChecked={meta?.is_featured === 1} />
              <Switch name="is_trending" label="Trending" hint="Shown in trending carousels."
                      defaultChecked={meta?.is_trending === 1} />
              <Switch name="is_new_arrival" label="New arrival" hint="Shows in 'Just arrived' section."
                      defaultChecked={meta?.is_new_arrival === 1} />
              <Switch name="is_premium" label="Premium" hint="Shows on the Premium collection page."
                      defaultChecked={meta?.is_premium === 1} />
            </div>
          </section>

          {/* Category Picker */}
          <section className="stu-card">
            <header className="stu-card__head"><h3>Where does this go?</h3></header>
            <div className="stu-card__body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <CategoryPicker
                categories={categories}
                initialCategory={product?.category || undefined}
                initialSub={product?.sub || undefined}
              />
              <label className="stu-field">
                <span className="stu-field__label">Product type</span>
                <select name="kind" value={kind} onChange={(e) => { setKind(e.target.value as "tailored" | "fabric"); markDirty(); }} className="stu-select">
                  <option value="tailored">Clothing / Accessory</option>
                  <option value="fabric">Fabric (sold by the metre)</option>
                </select>
              </label>
              <label className="stu-field">
                <span className="stu-field__label">For</span>
                <select name="gender" defaultValue={product?.gender ?? "men"} className="stu-select">
                  <option value="men">Men</option>
                  <option value="women">Women</option>
                  <option value="unisex">Unisex</option>
                </select>
              </label>
            </div>
          </section>
        </div>
      </div>

      {state.error && <p role="alert" className="stu-form__error">{state.error}</p>}

      <div className="stu-btn-row" style={{ justifyContent: "flex-end" }}>
        <button type="submit" className="stu-btn stu-btn--primary stu-btn--lg" disabled={pending}>
          {pending ? "Saving…" : (mode === "new" ? "Create product" : "Save changes")}
        </button>
      </div>
    </form>
  );
}
