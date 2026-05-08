"use client";
import { useActionState } from "react";
import { saveProductAction, type ActionState } from "../../actions/products";
import SavedLine from "../../components/SavedLine";
import type { Product } from "../../../../lib/admin/types";

const initial: ActionState = {};

export default function ProductEditor({ product }: { product: Product }) {
  const [state, formAction, pending] = useActionState(saveProductAction, initial);

  const sizesValue = product.sizes.join("\n");
  const featuresValue = product.features.join("\n");
  const specValue = product.spec.map(([k, v]) => `${k}: ${v}`).join("\n");

  return (
    <form action={formAction} className="adm-form">
      <input type="hidden" name="slug" value={product.slug} />

      <div className="adm-field__row">
        <label className="adm-field">
          <span className="adm-field__label">Piece name</span>
          <input
            name="name"
            defaultValue={product.name}
            required
            className="adm-field__input"
            style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 22, fontStyle: "italic" }}
          />
        </label>
        <label className="adm-field">
          <span className="adm-field__label">Category line</span>
          <input
            name="cat"
            defaultValue={product.cat}
            placeholder="Suits · Three-Piece"
            className="adm-field__input"
          />
        </label>
      </div>

      <label className="adm-field">
        <span className="adm-field__label">Editorial line</span>
        <input
          name="line"
          defaultValue={product.line}
          className="adm-field__input"
          style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 18, fontStyle: "italic" }}
        />
      </label>

      <div className="adm-field__row--3">
        <label className="adm-field">
          <span className="adm-field__label">Price · ₹</span>
          <input name="price" type="number" min={0} step={1} defaultValue={product.price} required className="adm-field__input" />
        </label>
        <label className="adm-field">
          <span className="adm-field__label">Sale price · ₹ <span className="adm-field__hint">(blank for none)</span></span>
          <input name="sale_price" type="number" min={0} step={1} defaultValue={product.sale_price ?? ""} className="adm-field__input" />
        </label>
        <label className="adm-field">
          <span className="adm-field__label">Badge</span>
          <input name="badge" defaultValue={product.badge ?? ""} placeholder="New · Sale · Bespoke" className="adm-field__input" />
        </label>
      </div>

      <div className="adm-field__row--3">
        <label className="adm-field">
          <span className="adm-field__label">Kind</span>
          <select name="kind" defaultValue={product.kind} className="adm-field__select">
            <option value="tailored">Tailored</option>
            <option value="fabric">Fabric</option>
          </select>
        </label>
        <label className="adm-field">
          <span className="adm-field__label">Gender</span>
          <select name="gender" defaultValue={product.gender} className="adm-field__select">
            <option value="men">Men</option>
            <option value="women">Women</option>
            <option value="unisex">Unisex</option>
          </select>
        </label>
        <label className="adm-field">
          <span className="adm-field__label">Status</span>
          <select name="status" defaultValue={product.status} className="adm-field__select">
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </label>
      </div>

      <div className="adm-field__row--3">
        <label className="adm-field">
          <span className="adm-field__label">Cat link</span>
          <select name="cat_link" defaultValue={product.cat_link} className="adm-field__select">
            <option>Men</option>
            <option>Women</option>
            <option>Fabrics</option>
          </select>
        </label>
        <label className="adm-field">
          <span className="adm-field__label">Category</span>
          <input name="category" defaultValue={product.category} className="adm-field__input" />
        </label>
        <label className="adm-field">
          <span className="adm-field__label">Sub</span>
          <input name="sub" defaultValue={product.sub ?? ""} className="adm-field__input" />
        </label>
      </div>

      <div className="adm-field__row--3">
        <label className="adm-field">
          <span className="adm-field__label">Fit</span>
          <input name="fit" defaultValue={product.fit} className="adm-field__input" />
        </label>
        <label className="adm-field">
          <span className="adm-field__label">Fabric</span>
          <input name="fabric" defaultValue={product.fabric} className="adm-field__input" />
        </label>
        <label className="adm-field">
          <span className="adm-field__label">Occasion</span>
          <input name="occasion" defaultValue={product.occasion} className="adm-field__input" />
        </label>
      </div>

      <div className="adm-field__row">
        <label className="adm-field">
          <span className="adm-field__label">Sizes <span className="adm-field__hint">(one per line · suffix "-oos" for out of stock)</span></span>
          <textarea name="sizes" defaultValue={sizesValue} className="adm-field__textarea" rows={6} />
        </label>
        <label className="adm-field">
          <span className="adm-field__label">Features <span className="adm-field__hint">(one per line)</span></span>
          <textarea name="features" defaultValue={featuresValue} className="adm-field__textarea" rows={6} />
        </label>
      </div>

      <label className="adm-field">
        <span className="adm-field__label">Spec sheet <span className="adm-field__hint">(one per line, key: value)</span></span>
        <textarea
          name="spec"
          defaultValue={specValue}
          className="adm-field__textarea"
          rows={8}
          style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 13 }}
        />
      </label>

      <label className="adm-field">
        <span className="adm-field__label">Editor's note</span>
        <textarea name="note" defaultValue={product.note} className="adm-field__textarea" rows={4} />
      </label>

      {product.kind === "fabric" && (
        <label className="adm-field">
          <span className="adm-field__label">Fabric description</span>
          <textarea name="description" defaultValue={product.description ?? ""} className="adm-field__textarea" rows={4} />
        </label>
      )}

      {state.error && <p className="adm-form__error">{state.error}</p>}

      <div className="adm-btn-row" style={{ alignItems: "center", justifyContent: "space-between" }}>
        <SavedLine at={product.updated_at} />
        <div className="adm-btn-row">
          <button type="submit" className="adm-btn adm-btn--primary" disabled={pending}>
            {pending ? "Stitching…" : "Save piece"}
          </button>
        </div>
      </div>
    </form>
  );
}
