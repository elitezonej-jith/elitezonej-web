"use client";
import { useState } from "react";
import { saveInventoryAction } from "../../actions/products";
import type { InventoryRow } from "../../../../lib/admin/types";

type Row = { size: string; stock: number; oos: boolean };

export default function InventoryEditor({ slug, rows }: { slug: string; rows: InventoryRow[] }) {
  const [state, setState] = useState<Row[]>(
    rows.map((r) => ({ size: r.size, stock: r.stock, oos: r.oos_flag === 1 })),
  );

  const update = (i: number, patch: Partial<Row>) => {
    setState((prev) => prev.map((r, k) => (k === i ? { ...r, ...patch } : r)));
  };
  const add = () => setState((prev) => [...prev, { size: "", stock: 0, oos: false }]);
  const remove = (i: number) => setState((prev) => prev.filter((_, k) => k !== i));

  return (
    <form action={saveInventoryAction} className="adm-panel adm-panel--ledger">
      <input type="hidden" name="slug" value={slug} />
      <div className="adm-panel__head">
        <h3>Sizes & stock</h3>
        <span className="adm-panel__head__kicker">Each size is a row</span>
      </div>
      <div className="adm-panel__body" style={{ paddingTop: 12 }}>
        <div className="adm-tbl-wrap">
          <table className="adm-tbl">
            <thead>
              <tr>
                <th>Size</th>
                <th className="adm-tbl__num">Stock</th>
                <th>Out of stock</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {state.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center", padding: 32 }}>
                    <span className="adm-italic">No sizes yet — add the first below.</span>
                  </td>
                </tr>
              ) : state.map((r, i) => (
                <tr key={i}>
                  <td>
                    <input
                      name="size"
                      value={r.size}
                      onChange={(e) => update(i, { size: e.target.value })}
                      placeholder="e.g. 38"
                      style={{ width: 90, padding: 6, fontFamily: "JetBrains Mono, monospace", fontSize: 13, border: "1px solid var(--adm-rule)", background: "var(--adm-paper)" }}
                      required
                    />
                  </td>
                  <td className="adm-tbl__num">
                    <input
                      name="stock"
                      type="number"
                      min={0}
                      step={1}
                      value={r.stock}
                      onChange={(e) => update(i, { stock: Math.max(0, Number(e.target.value)) })}
                      style={{ width: 80, padding: 6, fontFamily: "JetBrains Mono, monospace", fontSize: 13, textAlign: "right", border: "1px solid var(--adm-rule)", background: "var(--adm-paper)" }}
                      disabled={r.oos}
                    />
                  </td>
                  <td>
                    <label className="adm-switch">
                      <input
                        type="checkbox"
                        name="oos"
                        checked={r.oos}
                        onChange={(e) => update(i, { oos: e.target.checked, stock: e.target.checked ? 0 : r.stock })}
                      />
                      <span className="adm-switch__track" />
                      <span className="adm-switch__label">{r.oos ? "Marked OOS" : "In stock"}</span>
                    </label>
                  </td>
                  <td className="adm-tbl__num">
                    <button type="button" className="adm-btn adm-btn--sm adm-btn--ghost" onClick={() => remove(i)}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="adm-btn-row" style={{ marginTop: 16, justifyContent: "space-between" }}>
          <button type="button" className="adm-btn adm-btn--ghost adm-btn--sm" onClick={add}>+ Add size</button>
          <button type="submit" className="adm-btn adm-btn--primary">Save inventory</button>
        </div>
      </div>
    </form>
  );
}
