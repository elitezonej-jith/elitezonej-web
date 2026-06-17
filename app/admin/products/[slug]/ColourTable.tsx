"use client";
import { useRef, useState } from "react";
import { saveProductColourAction, deleteProductColourAction } from "../../actions/products";
import type { ProductColour } from "../../../../lib/admin/repos/product-colours";

export default function ColourTable({ slug, colours }: { slug: string; colours: ProductColour[] }) {
  const [editing, setEditing] = useState<number | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div className="adm-panel adm-panel--ledger">
      <div className="adm-panel__head">
        <h3>Colourways</h3>
        <span className="adm-panel__head__kicker">{colours.length} colour{colours.length === 1 ? "" : "s"}</span>
      </div>
      <div className="adm-panel__body" style={{ paddingTop: 12 }}>
        <div className="adm-tbl-wrap">
          <table className="adm-tbl">
            <thead>
              <tr>
                <th>Name</th>
                <th>Hex</th>
                <th>Default</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {colours.map((c) =>
                editing === c.id ? (
                  <tr key={c.id}>
                    <td colSpan={4}>
                      <form action={saveProductColourAction} className="adm-colour-inline" onSubmit={() => setEditing(null)}>
                        <input type="hidden" name="product_slug" value={slug} />
                        <input type="hidden" name="colour_id" value={c.id} />
                        <input name="name" defaultValue={c.name} required className="adm-colour-input" placeholder="Name" />
                        <input name="hex" type="color" defaultValue={c.hex} className="adm-colour-swatch-input" />
                        <label className="adm-colour-check">
                          <input type="checkbox" name="is_default" defaultChecked={c.is_default === 1} /> Def
                        </label>
                        <button type="submit" className="adm-btn adm-btn--sm adm-btn--primary">Save</button>
                        <button type="button" className="adm-btn adm-btn--sm adm-btn--ghost" onClick={() => setEditing(null)}>Cancel</button>
                      </form>
                    </td>
                  </tr>
                ) : (
                  <tr key={c.id}>
                    <td>{c.name}</td>
                    <td>
                      <span className="adm-colour-dot" style={{ background: c.hex }} />
                      <code className="adm-mono">{c.hex}</code>
                    </td>
                    <td>{c.is_default ? "✓" : ""}</td>
                    <td className="adm-tbl__num">
                      <button type="button" className="adm-btn adm-btn--sm adm-btn--ghost" onClick={() => setEditing(c.id)}>Edit</button>
                      <form action={deleteProductColourAction} style={{ display: "inline" }} onSubmit={(e) => { if (!confirm('Delete this colour?')) e.preventDefault(); }}>
                        <input type="hidden" name="product_slug" value={slug} />
                        <input type="hidden" name="colour_id" value={c.id} />
                        <button type="submit" className="adm-btn adm-btn--sm adm-btn--ghost">Delete</button>
                      </form>
                    </td>
                  </tr>
                ),
              )}
              {colours.length === 0 && !editing && (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center", padding: 32 }}>
                    <span className="adm-italic">No colourways yet — add the first below.</span>
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={4}>
                  <form ref={formRef} action={saveProductColourAction} className="adm-colour-inline">
                    <input type="hidden" name="product_slug" value={slug} />
                    <input name="name" required className="adm-colour-input" placeholder="Colour name" />
                    <input name="hex" type="color" defaultValue="#4a3728" className="adm-colour-swatch-input" />
                    <label className="adm-colour-check">
                      <input type="checkbox" name="is_default" /> Def
                    </label>
                    <button type="submit" className="adm-btn adm-btn--sm adm-btn--primary">+ Add</button>
                  </form>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
