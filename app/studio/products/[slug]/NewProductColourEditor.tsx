"use client";
import { useState, useRef } from "react";

export type ColourRow = {
  name: string;
  hex: string;
  is_default: boolean;
};

type Props = {
  onChange: (rows: ColourRow[]) => void;
};

export default function NewProductColourEditor({ onChange }: Props) {
  const [rows, setRows] = useState<ColourRow[]>([]);
  const nameRefs = useRef<(HTMLInputElement | null)[]>([]);

  function update(next: ColourRow[]) {
    setRows(next);
    onChange(next);
  }

  function addRow() {
    const isFirst = rows.length === 0;
    const next = [...rows, { name: "", hex: "#000000", is_default: isFirst }];
    update(next);
    setTimeout(() => {
      nameRefs.current[next.length - 1]?.focus();
    }, 0);
  }

  function removeRow(index: number) {
    let next = rows.filter((_, i) => i !== index);
    // If we removed the default and there are rows left, make the first one default
    if (next.length > 0 && !next.some((r) => r.is_default)) {
      next = next.map((r, i) => (i === 0 ? { ...r, is_default: true } : r));
    }
    update(next);
  }

  function handleNameChange(index: number, value: string) {
    const next = rows.map((r, i) => (i === index ? { ...r, name: value } : r));
    update(next);
  }

  function handleHexChange(index: number, value: string) {
    const next = rows.map((r, i) => (i === index ? { ...r, hex: value } : r));
    update(next);
  }

  function handleDefaultChange(index: number) {
    const next = rows.map((r, i) => ({ ...r, is_default: i === index }));
    update(next);
  }

  if (rows.length === 0) {
    return (
      <div className="stu-new-colours">
        <div className="stu-new-colours__empty">
          <p className="stu-new-colours__empty-sub">
            Add colour options so customers can pick a variant. You can also add them later.
          </p>
          <button
            type="button"
            className="stu-btn stu-btn--ghost stu-btn--sm"
            onClick={addRow}
          >
            + Add colour
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="stu-new-colours">
      <div className="stu-new-colours__rows">
        {rows.map((row, i) => (
          <div key={i} className="stu-new-colours__row">
            {/* Swatch with colour picker */}
            <label className="stu-new-colours__swatch-wrap">
              <span
                className="stu-new-colours__swatch"
                style={{ backgroundColor: row.hex }}
              />
              <input
                type="color"
                value={row.hex}
                onChange={(e) => handleHexChange(i, e.target.value)}
                className="stu-new-colours__color-picker"
                tabIndex={-1}
                aria-hidden="true"
              />
            </label>

            {/* Name */}
            <input
              ref={(el) => { nameRefs.current[i] = el; }}
              type="text"
              className="stu-input stu-new-colours__name"
              value={row.name}
              onChange={(e) => handleNameChange(i, e.target.value)}
              placeholder="e.g. Navy Blue"
              autoComplete="off"
            />

            {/* Hex text */}
            <input
              type="text"
              className="stu-input stu-new-colours__hex"
              value={row.hex}
              onChange={(e) => handleHexChange(i, e.target.value)}
              pattern="^#[0-9A-Fa-f]{6}$"
              maxLength={7}
            />

            {/* Default radio */}
            <label className="stu-new-colours__default" title="Set as default colour">
              <input
                type="radio"
                name="_colour_default"
                checked={row.is_default}
                onChange={() => handleDefaultChange(i)}
              />
              <span>Default</span>
            </label>

            {/* Remove */}
            <button
              type="button"
              className="stu-new-colours__remove"
              onClick={() => removeRow(i)}
              title="Remove colour"
              aria-label={`Remove colour ${row.name}`}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        className="stu-btn stu-btn--ghost stu-btn--sm"
        onClick={addRow}
      >
        + Add colour
      </button>
    </div>
  );
}
