"use client";
import { useActionState, useState } from "react";
import { saveProductAction, type ProductSaveState } from "../../actions/products";
import Switch from "../../components/Switch";
import type { Product } from "../../../../lib/admin/types";
import type { ProductMeta } from "../../../../lib/admin/repos/product-meta";

const initial: ProductSaveState = {};

export default function ProductForm({
  mode, product, meta,
}: {
  mode: "new" | "edit";
  product?: Product;
  meta?: ProductMeta;
}) {
  const [state, action, pending] = useActionState(saveProductAction, initial);
  const [name, setName] = useState(product?.name ?? "");
  const slugDerived = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const sizes = product?.sizes?.join("\n") ?? "";
  const features = product?.features?.join("\n") ?? "";
  const spec = product?.spec?.map(([k, v]) => `${k}: ${v}`).join("\n") ?? "";

  return (
    <form action={action} className="stu-form">
      <div className="stu-cols">
        {/* MAIN COLUMN */}
        <div className="stu-stack">

          {/* Basics */}
          <section className="stu-card">
            <header className="stu-card__head"><h3>Basic info</h3></header>
            <div className="stu-card__body">
              <div className="stu-row">
                <label className="stu-field">
                  <span className="stu-field__label">Product name</span>
                  <input name="name" value={name} onChange={(e) => setName(e.target.value)}
                         required className="stu-input" placeholder="The Heritage Three-Piece" />
                </label>
                <label className="stu-field">
                  <span className="stu-field__label">URL handle <span className="stu-field__hint">(lowercase, no spaces)</span></span>
                  <input name="slug" defaultValue={product?.slug ?? slugDerived} key={mode === "new" ? slugDerived : undefined}
                         required pattern="[a-z0-9-]+" readOnly={mode === "edit"}
                         className="stu-input" placeholder="heritage-three-piece" style={{ fontFamily: "ui-monospace, monospace" }} />
                </label>
              </div>

              <label className="stu-field">
                <span className="stu-field__label">One-line summary</span>
                <input name="line" defaultValue={product?.line ?? ""} className="stu-input"
                       placeholder="A tailored three-piece in 280gsm Italian wool" />
              </label>

              <label className="stu-field">
                <span className="stu-field__label">Short description <span className="stu-field__hint">(shown on product cards)</span></span>
                <textarea name="short_description" defaultValue={meta?.short_description ?? ""} className="stu-textarea" rows={2} />
              </label>

              <label className="stu-field">
                <span className="stu-field__label">Full description</span>
                <textarea name="long_description" defaultValue={meta?.long_description ?? product?.description ?? ""}
                          className="stu-textarea" rows={6}
                          placeholder="Tell the customer everything about this piece — fabric, fit, story." />
              </label>
            </div>
          </section>

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
                  <span className="stu-field__label">Sale price · ₹ <span className="stu-field__hint">(blank for none)</span></span>
                  <input name="sale_price" type="number" min={0} step={1} defaultValue={product?.sale_price ?? ""} className="stu-input" />
                </label>
                <label className="stu-field">
                  <span className="stu-field__label">Badge text <span className="stu-field__hint">(optional)</span></span>
                  <input name="badge" defaultValue={product?.badge ?? ""} className="stu-input" placeholder="Sale · New · Bespoke" />
                </label>
              </div>
            </div>
          </section>

          {/* Sizes / variants */}
          <section className="stu-card">
            <header className="stu-card__head"><h3>Sizes & options</h3></header>
            <div className="stu-card__body">
              <div className="stu-row">
                <label className="stu-field">
                  <span className="stu-field__label">Sizes <span className="stu-field__hint">(one per line)</span></span>
                  <textarea name="sizes" defaultValue={sizes} className="stu-textarea" rows={6}
                            placeholder={"36\n38\n40\n42\n44"} style={{ fontFamily: "ui-monospace, monospace" }} />
                </label>
                <label className="stu-field">
                  <span className="stu-field__label">Highlights <span className="stu-field__hint">(one per line)</span></span>
                  <textarea name="features" defaultValue={features} className="stu-textarea" rows={6}
                            placeholder={"Half-canvas construction\nHand-padded lapels\nSide adjusters"} />
                </label>
              </div>
              <label className="stu-field" style={{ marginTop: 18 }}>
                <span className="stu-field__label">Spec sheet <span className="stu-field__hint">(one per line — &ldquo;Key: Value&rdquo;)</span></span>
                <textarea name="spec" defaultValue={spec} className="stu-textarea" rows={6}
                          placeholder={"Cloth: Super 120s pure wool\nWeight: 280 gsm"}
                          style={{ fontFamily: "ui-monospace, monospace", fontSize: 13 }} />
              </label>
            </div>
          </section>

          {/* SEO */}
          <section className="stu-card">
            <header className="stu-card__head"><h3>Search engine optimization</h3></header>
            <div className="stu-card__body">
              <label className="stu-field">
                <span className="stu-field__label">Meta title</span>
                <input name="meta_title" defaultValue={meta?.meta_title ?? ""} className="stu-input"
                       maxLength={120} placeholder={product?.name ?? "Page title shown in Google results"} />
              </label>
              <label className="stu-field" style={{ marginTop: 16 }}>
                <span className="stu-field__label">Meta description</span>
                <textarea name="meta_description" defaultValue={meta?.meta_description ?? ""} className="stu-textarea" rows={3}
                          maxLength={240} placeholder="One or two sentences shown in Google results." />
              </label>
              <label className="stu-field" style={{ marginTop: 16 }}>
                <span className="stu-field__label">Social share image <span className="stu-field__hint">(URL or path)</span></span>
                <input name="og_image_path" defaultValue={meta?.og_image_path ?? ""} className="stu-input"
                       placeholder="/uploads/products/share.webp" style={{ fontFamily: "ui-monospace, monospace" }} />
              </label>
            </div>
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

              <Switch name="is_featured" label="Featured product" hint="Shown in 'Featured' sections of the homepage."
                      defaultChecked={meta?.is_featured === 1} />
              <Switch name="is_trending" label="Trending" hint="Bubbles up in trending carousels."
                      defaultChecked={meta?.is_trending === 1} />
              <Switch name="is_new_arrival" label="New arrival" hint="Shows in the 'Just arrived' section."
                      defaultChecked={meta?.is_new_arrival === 1} />
            </div>
          </section>

          <section className="stu-card">
            <header className="stu-card__head"><h3>Organize</h3></header>
            <div className="stu-card__body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <label className="stu-field">
                <span className="stu-field__label">Type</span>
                <select name="kind" defaultValue={product?.kind ?? "tailored"} className="stu-select">
                  <option value="tailored">Tailored / ready-to-wear</option>
                  <option value="fabric">Fabric · sold by the metre</option>
                </select>
              </label>
              <label className="stu-field">
                <span className="stu-field__label">Audience</span>
                <select name="gender" defaultValue={product?.gender ?? "men"} className="stu-select">
                  <option value="men">Men</option>
                  <option value="women">Women</option>
                  <option value="unisex">Unisex</option>
                </select>
              </label>
              <label className="stu-field">
                <span className="stu-field__label">Top-level link</span>
                <select name="cat_link" defaultValue={product?.cat_link ?? "Men"} className="stu-select">
                  <option>Men</option>
                  <option>Women</option>
                  <option>Fabrics</option>
                </select>
              </label>
              <label className="stu-field">
                <span className="stu-field__label">Category</span>
                <input name="category" defaultValue={product?.category ?? ""} className="stu-input"
                       placeholder="suits, shirts, accessories" />
              </label>
              <label className="stu-field">
                <span className="stu-field__label">Sub-category</span>
                <input name="sub" defaultValue={product?.sub ?? ""} className="stu-input"
                       placeholder="wedding-suits, tapered-pants" />
              </label>
              <label className="stu-field">
                <span className="stu-field__label">Display category line</span>
                <input name="cat" defaultValue={product?.cat ?? ""} className="stu-input"
                       placeholder="Suits · Three-Piece" />
              </label>
              <div className="stu-row">
                <label className="stu-field">
                  <span className="stu-field__label">Fit</span>
                  <input name="fit" defaultValue={product?.fit ?? ""} className="stu-input" />
                </label>
                <label className="stu-field">
                  <span className="stu-field__label">Fabric</span>
                  <input name="fabric" defaultValue={product?.fabric ?? ""} className="stu-input" />
                </label>
              </div>
              <label className="stu-field">
                <span className="stu-field__label">Occasion</span>
                <input name="occasion" defaultValue={product?.occasion ?? ""} className="stu-input"
                       placeholder="Wedding · Boardroom · Festive" />
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
