"use client";
import { useState } from "react";
import { saveFabricColoursAction } from "../../actions/fabrics";
import type { FabricColourRow } from "../../../../lib/admin/types";

type Row = { name: string; hex: string; stock_meters: number; image_dir: string };

export default function ColourwayMatrix({ slug, colours }: { slug: string; colours: FabricColourRow[] }) {
  const [rows, setRows] = useState<Row[]>(
    colours.map((c) => ({
      name: c.name,
      hex: c.hex,
      stock_meters: c.stock_meters,
      image_dir: c.image_dir ?? `${slug}/${c.name.toLowerCase()}`,
    })),
  );

  const update = (i: number, patch: Partial<Row>) => setRows((p) => p.map((r, k) => (k === i ? { ...r, ...patch } : r)));
  const add = () => setRows((p) => [...p, { name: "", hex: "#000000", stock_meters: 0, image_dir: `${slug}/` }]);
  const remove = (i: number) => setRows((p) => p.filter((_, k) => k !== i));

  return (
    <form action={saveFabricColoursAction} className="adm-panel adm-panel--ledger">
      <input type="hidden" name="slug" value={slug} />
      <div className="adm-panel__head">
        <h3>Colourways</h3>
        <span className="adm-panel__head__kicker">{rows.length} entries</span>
      </div>
      <div className="adm-tbl-wrap">
        <table className="adm-tbl">
          <thead>
            <tr>
              <th style={{ width: 80 }}>Swatch</th>
              <th>Name</th>
              <th>Hex</th>
              <th className="adm-tbl__num">Stock (m)</th>
              <th>Image folder</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: 32 }}>
                  <span className="adm-italic">No colourways yet — add the first below.</span>
                </td>
              </tr>
            ) : rows.map((r, i) => (
              <tr key={i}>
                <td>
                  <label style={{ display: "block", cursor: "pointer" }}>
                    <span className="adm-swatch__chip" style={{ background: r.hex, width: 36, height: 36 }} />
                    <input
                      type="color"
                      value={r.hex}
                      onChange={(e) => update(i, { hex: e.target.value })}
                      style={{ display: "none" }}
                      name="hex"
                    />
                  </label>
                </td>
                <td>
                  <input
                    name="name"
                    value={r.name}
                    onChange={(e) => update(i, { name: e.target.value })}
                    placeholder="Charcoal"
                    style={{ padding: 6, border: "1px solid var(--adm-rule)", background: "var(--adm-paper)", fontFamily: "Cormorant Garamond, serif", fontStyle: "italic", fontSize: 16, minWidth: 140 }}
                    required
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={r.hex}
                    onChange={(e) => update(i, { hex: e.target.value })}
                    pattern="^#[0-9A-Fa-f]{6}$"
                    style={{ padding: 6, border: "1px solid var(--adm-rule)", background: "var(--adm-paper)", fontFamily: "JetBrains Mono, monospace", fontSize: 12, width: 100, textTransform: "uppercase" }}
                  />
                </td>
                <td className="adm-tbl__num">
                  <input
                    name="stock_meters"
                    type="number"
                    min={0}
                    step={1}
                    value={r.stock_meters}
                    onChange={(e) => update(i, { stock_meters: Math.max(0, Number(e.target.value)) })}
                    style={{ padding: 6, border: "1px solid var(--adm-rule)", background: "var(--adm-paper)", textAlign: "right", width: 80, fontFamily: "JetBrains Mono, monospace", fontSize: 13 }}
                  />
                </td>
                <td>
                  <input
                    name="image_dir"
                    value={r.image_dir}
                    onChange={(e) => update(i, { image_dir: e.target.value })}
                    style={{ padding: 6, border: "1px solid var(--adm-rule)", background: "var(--adm-paper)", fontFamily: "JetBrains Mono, monospace", fontSize: 11, minWidth: 220 }}
                    placeholder={`${slug}/charcoal`}
                  />
                </td>
                <td>
                  <button type="button" className="adm-btn adm-btn--sm adm-btn--ghost" onClick={() => remove(i)}>Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="adm-btn-row" style={{ padding: "16px 28px", justifyContent: "space-between" }}>
        <button type="button" className="adm-btn adm-btn--ghost adm-btn--sm" onClick={add}>+ Add colourway</button>
        <button type="submit" className="adm-btn adm-btn--primary">Save colourways</button>
      </div>
    </form>
  );
}
