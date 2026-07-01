"use client";
import { useState, useCallback, useRef } from "react";

export type ColourwayRow = {
  name: string;
  hex: string;
  stock_meters: number;
  image_dir: string;
};

type Props = {
  initial: ColourwayRow[];
  slug: string;
  onChange: (rows: ColourwayRow[]) => void;
};

const LOW_STOCK_THRESHOLD = 5; // metres

export default function FabricStockEditor({ initial, slug, onChange }: Props) {
  const [rows, setRows] = useState<ColourwayRow[]>(initial);
  const [error, setError] = useState("");
  const nameRefs = useRef<(HTMLInputElement | null)[]>([]);

  const update = useCallback(
    (next: ColourwayRow[]) => {
      setRows(next);
      onChange(next);
    },
    [onChange],
  );

  function handleNameChange(index: number, value: string) {
    const next = rows.map((r, i) => (i === index ? { ...r, name: value } : r));
    const trimmed = value.trim().toLowerCase();
    const hasDupe =
      trimmed !== "" &&
      next.some((r, i) => i !== index && r.name.trim().toLowerCase() === trimmed);
    setError(hasDupe ? `Duplicate colourway "${value.trim()}"` : "");
    update(next);
  }

  function handleHexChange(index: number, value: string) {
    const next = rows.map((r, i) => (i === index ? { ...r, hex: value } : r));
    update(next);
  }

  function handleStockChange(index: number, value: string) {
    const stock = Math.max(0, Math.round(Number(value) || 0));
    const next = rows.map((r, i) => (i === index ? { ...r, stock_meters: stock } : r));
    update(next);
  }

  function handleImageDirChange(index: number, value: string) {
    const next = rows.map((r, i) => (i === index ? { ...r, image_dir: value } : r));
    update(next);
  }

  function addRow() {
    const next = [...rows, { name: "", hex: "#000000", stock_meters: 0, image_dir: "" }];
    update(next);
    // Focus the new name input after render
    setTimeout(() => {
      nameRefs.current[next.length - 1]?.focus();
    }, 0);
  }

  function removeRow(index: number) {
    const next = rows.filter((_, i) => i !== index);
    setError("");
    update(next);
  }

  function getDefaultImageDir(name: string): string {
    if (!name.trim()) return "";
    return `${slug}/${name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`;
  }

  // Auto-fill image_dir when name changes and image_dir is empty or was auto-generated
  function handleNameBlur(index: number) {
    const row = rows[index];
    if (!row) return;
    const autoDir = getDefaultImageDir(row.name);
    // Only auto-fill if image_dir is empty or matches a previous auto-generated pattern
    if (!row.image_dir || row.image_dir === getDefaultImageDir(rows[index]?.name ?? "")) {
      const next = rows.map((r, i) => (i === index ? { ...r, image_dir: autoDir } : r));
      update(next);
    }
  }

  const totalMeters = rows.reduce((sum, r) => sum + r.stock_meters, 0);
  const lowCount = rows.filter((r) => r.name.trim() && r.stock_meters > 0 && r.stock_meters <= LOW_STOCK_THRESHOLD).length;
  const oosCount = rows.filter((r) => r.name.trim() && r.stock_meters === 0).length;

  // Determine if a hex is light enough to need a visible border
  function isLightHex(hex: string): boolean {
    const h = hex.replace("#", "");
    if (h.length !== 6) return false;
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    // Relative luminance approximation
    return (r * 0.299 + g * 0.587 + b * 0.114) > 200;
  }

  if (rows.length === 0) {
    return (
      <div className="stu-fabric-stock">
        <div className="stu-fabric-stock__empty">
          <span className="stu-fabric-stock__empty-icon">🎨</span>
          <p className="stu-fabric-stock__empty-title">No colourways yet</p>
          <p className="stu-fabric-stock__empty-sub">Add colourways to track stock per colour variant</p>
          <button
            type="button"
            className="stu-btn stu-btn--brand stu-btn--sm"
            onClick={addRow}
          >
            + Add first colourway
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="stu-fabric-stock">
      <div className="stu-fabric-stock__header">
        <span className="stu-fabric-stock__col-label" />
        <span className="stu-fabric-stock__col-label">Name</span>
        <span className="stu-fabric-stock__col-label">Hex</span>
        <span className="stu-fabric-stock__col-label">Stock (m)</span>
        <span className="stu-fabric-stock__col-label" />
      </div>

      <div className="stu-fabric-stock__rows">
        {rows.map((row, i) => {
          const isOos = row.name.trim() !== "" && row.stock_meters === 0;
          const isLow = row.name.trim() !== "" && row.stock_meters > 0 && row.stock_meters <= LOW_STOCK_THRESHOLD;
          const rowClass = `stu-fabric-stock__row ${isOos ? "stu-fabric-stock__row--oos" : isLow ? "stu-fabric-stock__row--low" : ""}`;

          return (
            <div key={i} className={rowClass}>
              {/* Swatch with colour picker */}
              <label className="stu-fabric-stock__swatch-wrap">
                <span
                  className={`stu-fabric-stock__swatch ${isLightHex(row.hex) ? "stu-fabric-stock__swatch--light" : ""}`}
                  style={{ backgroundColor: row.hex }}
                  aria-label={`Pick colour for ${row.name || "new colourway"}`}
                />
                <input
                  type="color"
                  value={row.hex}
                  onChange={(e) => handleHexChange(i, e.target.value)}
                  className="stu-fabric-stock__color-picker"
                  tabIndex={-1}
                  aria-hidden="true"
                />
              </label>

              {/* Name */}
              <input
                ref={(el) => { nameRefs.current[i] = el; }}
                type="text"
                className="stu-input stu-fabric-stock__name-input"
                value={row.name}
                onChange={(e) => handleNameChange(i, e.target.value)}
                onBlur={() => handleNameBlur(i)}
                placeholder="Charcoal"
                autoComplete="off"
              />

              {/* Hex text input */}
              <input
                type="text"
                className="stu-input stu-fabric-stock__hex-input"
                value={row.hex}
                onChange={(e) => handleHexChange(i, e.target.value)}
                pattern="^#[0-9A-Fa-f]{6}$"
                maxLength={7}
              />

              {/* Stock metres */}
              <div className="stu-fabric-stock__stock-wrap">
                <input
                  type="number"
                  className="stu-input stu-fabric-stock__stock-input"
                  value={row.stock_meters}
                  min={0}
                  step={1}
                  onChange={(e) => handleStockChange(i, e.target.value)}
                />
                <span className="stu-fabric-stock__stock-unit">m</span>
              </div>

              {/* Remove */}
              <button
                type="button"
                className="stu-fabric-stock__remove"
                onClick={() => removeRow(i)}
                title="Remove colourway"
                aria-label={`Remove colourway ${row.name}`}
              >
                ×
              </button>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        className="stu-btn stu-btn--ghost stu-btn--sm stu-fabric-stock__add"
        onClick={addRow}
      >
        + Add colourway
      </button>

      {error && (
        <p className="stu-fabric-stock__error" role="alert">
          {error}
        </p>
      )}

      <div className="stu-fabric-stock__summary" aria-live="polite">
        <span>{totalMeters}m total across {rows.length} colourway{rows.length !== 1 ? "s" : ""}</span>
        {lowCount > 0 && (
          <span className="stu-fabric-stock__summary-low">
            · {lowCount} low (≤{LOW_STOCK_THRESHOLD}m)
          </span>
        )}
        {oosCount > 0 && (
          <span className="stu-fabric-stock__summary-oos">
            · {oosCount} out of stock
          </span>
        )}
      </div>
    </div>
  );
}
