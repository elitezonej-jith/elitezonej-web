"use client";
import { useActionState, useState } from "react";
import { saveProductAction, type ActionState } from "../../actions/products";

const initial: ActionState = {};

export default function NewProductForm() {
  const [state, action, pending] = useActionState(saveProductAction, initial);
  const [name, setName] = useState("");
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return (
    <form action={action} className="adm-form">
      <div className="adm-field__row">
        <label className="adm-field">
          <span className="adm-field__label">Piece name</span>
          <input
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
            className="adm-field__input"
            style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 22, fontStyle: "italic" }}
            placeholder="The Heritage Three-Piece"
          />
        </label>
        <label className="adm-field">
          <span className="adm-field__label">Slug · auto from name</span>
          <input
            name="slug"
            defaultValue={slug}
            key={slug}
            required
            pattern="[a-z0-9-]+"
            className="adm-field__input"
            style={{ fontFamily: "JetBrains Mono, monospace" }}
          />
        </label>
      </div>

      <label className="adm-field">
        <span className="adm-field__label">Editorial line</span>
        <input name="line" className="adm-field__input" placeholder="A tailored three-piece in 280gsm Italian wool…"
               style={{ fontFamily: "Cormorant Garamond, serif", fontStyle: "italic", fontSize: 17 }} />
      </label>

      <div className="adm-field__row--3">
        <label className="adm-field">
          <span className="adm-field__label">Price · ₹</span>
          <input name="price" type="number" min={0} step={1} required className="adm-field__input" />
        </label>
        <label className="adm-field">
          <span className="adm-field__label">Sale price · ₹</span>
          <input name="sale_price" type="number" min={0} step={1} className="adm-field__input" />
        </label>
        <label className="adm-field">
          <span className="adm-field__label">Badge</span>
          <input name="badge" placeholder="New · Sale · Bespoke" className="adm-field__input" />
        </label>
      </div>

      <div className="adm-field__row--3">
        <label className="adm-field">
          <span className="adm-field__label">Kind</span>
          <select name="kind" defaultValue="tailored" className="adm-field__select">
            <option value="tailored">Tailored</option>
            <option value="fabric">Fabric</option>
          </select>
        </label>
        <label className="adm-field">
          <span className="adm-field__label">Gender</span>
          <select name="gender" defaultValue="men" className="adm-field__select">
            <option value="men">Men</option>
            <option value="women">Women</option>
            <option value="unisex">Unisex</option>
          </select>
        </label>
        <label className="adm-field">
          <span className="adm-field__label">Status</span>
          <select name="status" defaultValue="draft" className="adm-field__select">
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </label>
      </div>

      <div className="adm-field__row--3">
        <label className="adm-field">
          <span className="adm-field__label">Cat link</span>
          <select name="cat_link" defaultValue="Men" className="adm-field__select">
            <option>Men</option>
            <option>Women</option>
            <option>Fabrics</option>
          </select>
        </label>
        <label className="adm-field">
          <span className="adm-field__label">Category</span>
          <input name="category" placeholder="suits, shirts, accessories…" className="adm-field__input" />
        </label>
        <label className="adm-field">
          <span className="adm-field__label">Sub</span>
          <input name="sub" placeholder="wedding-suits, tapered-pants…" className="adm-field__input" />
        </label>
      </div>

      <label className="adm-field">
        <span className="adm-field__label">Category line</span>
        <input name="cat" placeholder="Suits · Three-Piece" className="adm-field__input" />
      </label>

      <div className="adm-field__row--3">
        <label className="adm-field">
          <span className="adm-field__label">Fit</span>
          <input name="fit" placeholder="Tailored / Slim / Regular" className="adm-field__input" />
        </label>
        <label className="adm-field">
          <span className="adm-field__label">Fabric</span>
          <input name="fabric" placeholder="Wool / Silk / Cotton" className="adm-field__input" />
        </label>
        <label className="adm-field">
          <span className="adm-field__label">Occasion</span>
          <input name="occasion" placeholder="Wedding / Boardroom / Festive" className="adm-field__input" />
        </label>
      </div>

      <div className="adm-field__row">
        <label className="adm-field">
          <span className="adm-field__label">Sizes <span className="adm-field__hint">(one per line)</span></span>
          <textarea name="sizes" className="adm-field__textarea" rows={6} placeholder={"36\n38\n40\n42\n44"} />
        </label>
        <label className="adm-field">
          <span className="adm-field__label">Features <span className="adm-field__hint">(one per line)</span></span>
          <textarea name="features" className="adm-field__textarea" rows={6} />
        </label>
      </div>

      <label className="adm-field">
        <span className="adm-field__label">Spec <span className="adm-field__hint">(one per line, key: value)</span></span>
        <textarea name="spec" className="adm-field__textarea" rows={6}
                  placeholder={"Cloth: Super 120s pure wool\nWeight: 280 gsm"}
                  style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 13 }} />
      </label>

      <label className="adm-field">
        <span className="adm-field__label">Editor's note</span>
        <textarea name="note" className="adm-field__textarea" rows={4} />
      </label>

      {state.error && <p role="alert" className="adm-form__error">{state.error}</p>}

      <div style={{ marginTop: 8 }}>
        <button type="submit" className="adm-btn adm-btn--primary" disabled={pending}>
          {pending ? "Stitching…" : "Inscribe new piece"}
        </button>
      </div>
    </form>
  );
}
