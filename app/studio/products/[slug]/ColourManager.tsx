"use client";
import { useState } from "react";
import { useToast } from "../../components/Toast";
import {
  saveProductColourAction,
  deleteProductColourAction,
  assignImageColourAction,
} from "../../actions/products";
import type { ProductColour } from "../../../../lib/admin/repos/product-colours";
import type { ProductImage } from "../../../../lib/admin/repos/product-images";

export default function ColourManager({
  slug,
  colours,
  images,
}: {
  slug: string;
  colours: ProductColour[];
  images: ProductImage[];
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const { show } = useToast();

  return (
    <section className="stu-card">
      <header className="stu-card__head">
        <h3>Colours</h3>
        <button
          type="button"
          className="stu-btn stu-btn--ghost"
          onClick={() => { setShowAdd(!showAdd); setEditId(null); }}
        >
          {showAdd ? "Cancel" : "+ Add colour"}
        </button>
      </header>
      <div className="stu-card__body">
        {showAdd && (
          <InlineForm
            slug={slug}
            onDone={() => { setShowAdd(false); show("Colour added", "success"); }}
          />
        )}

        {colours.length === 0 && !showAdd && (
          <p style={{ fontSize: 13, color: "var(--stu-text-3)" }}>
            No colours yet. Add one to let customers pick a variant.
          </p>
        )}

        {/* TODO: Add drag-to-reorder UI here (requires @dnd-kit). reorderProductColoursAction exists but is unreachable until then. */}
        <div className="stu-colour-list">
          {colours.map((c) =>
            editId === c.id ? (
              <InlineForm
                key={c.id}
                slug={slug}
                existing={c}
                onDone={() => { setEditId(null); show("Colour updated", "success"); }}
                onCancel={() => setEditId(null)}
              />
            ) : (
              <div key={c.id} className="stu-colour-row">
                <span
                  className="stu-colour-swatch"
                  style={{ background: c.hex }}
                />
                <span className="stu-colour-name">
                  {c.name}
                  {c.is_default ? <span className="stu-colour-badge">default</span> : null}
                </span>
                <code className="stu-colour-hex">{c.hex}</code>
                <button
                  type="button"
                  className="stu-btn stu-btn--ghost stu-btn--xs"
                  onClick={() => { setEditId(c.id); setShowAdd(false); }}
                >
                  Edit
                </button>
                <form
                  action={async (fd) => {
                    if (!confirm(`Delete colour "${c.name}"?`)) return;
                    await deleteProductColourAction(fd);
                    show("Colour removed", "success");
                  }}
                >
                  <input type="hidden" name="colour_id" value={c.id} />
                  <input type="hidden" name="product_slug" value={slug} />
                  <button type="submit" className="stu-btn stu-btn--ghost stu-btn--xs stu-btn--danger">
                    Delete
                  </button>
                </form>
              </div>
            ),
          )}
        </div>

        {/* Image–colour assignment */}
        {colours.length > 0 && images.length > 0 && (
          <div className="stu-colour-assign">
            <h4 className="stu-colour-assign__title">Image colour assignment</h4>
            <div className="stu-colour-assign__grid">
              {images.map((img) => (
                <div key={`${img.id}-${img.colour_id}`} className="stu-colour-assign__item">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.image_path} alt={img.alt} className="stu-colour-assign__thumb" />
                  <form action={assignImageColourAction}>
                    <input type="hidden" name="image_id" value={img.id} />
                    <input type="hidden" name="product_slug" value={slug} />
                    <select
                      name="colour_id"
                      defaultValue={img.colour_id ?? ""}
                      className="stu-select stu-select--sm"
                      onChange={(e) => e.currentTarget.form?.requestSubmit()}
                    >
                      <option value="">No colour</option>
                      {colours.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </form>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function InlineForm({
  slug,
  existing,
  onDone,
  onCancel,
}: {
  slug: string;
  existing?: ProductColour;
  onDone: () => void;
  onCancel?: () => void;
}) {
  return (
    <form
      className="stu-colour-form"
      action={async (fd) => {
        await saveProductColourAction(fd);
        onDone();
      }}
    >
      <input type="hidden" name="product_slug" value={slug} />
      {existing && <input type="hidden" name="colour_id" value={existing.id} />}
      <input
        name="name"
        defaultValue={existing?.name ?? ""}
        placeholder="Colour name"
        required
        className="stu-input stu-input--sm"
      />
      <input
        name="hex"
        type="color"
        defaultValue={existing?.hex ?? "#000000"}
        className="stu-colour-picker"
      />
      <label className="stu-colour-form__default">
        <input
          type="checkbox"
          name="is_default"
          defaultChecked={existing?.is_default === 1}
        />
        Default
      </label>
      <button type="submit" className="stu-btn stu-btn--primary stu-btn--xs">
        {existing ? "Update" : "Add"}
      </button>
      {onCancel && (
        <button type="button" className="stu-btn stu-btn--ghost stu-btn--xs" onClick={onCancel}>
          Cancel
        </button>
      )}
    </form>
  );
}
