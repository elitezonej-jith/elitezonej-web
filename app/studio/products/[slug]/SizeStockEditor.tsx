"use client";
import { useState, useCallback } from "react";

export type SizeStockRow = { size: string; stock: number };

type Props = {
  initial: SizeStockRow[];
  onChange: (rows: SizeStockRow[]) => void;
};

export default function SizeStockEditor({ initial, onChange }: Props) {
  const [rows, setRows] = useState<SizeStockRow[]>(initial);
  const [error, setError] = useState("");

  const update = useCallback(
    (next: SizeStockRow[]) => {
      setRows(next);
      onChange(next);
    },
    [onChange],
  );

  function handleSizeChange(index: number, value: string) {
    const next = rows.map((r, i) => (i === index ? { ...r, size: value } : r));
    // Check for duplicates (case-insensitive, trimmed)
    const trimmed = value.trim().toLowerCase();
    const hasDupe =
      trimmed !== "" &&
      next.some(
        (r, i) => i !== index && r.size.trim().toLowerCase() === trimmed,
      );
    setError(hasDupe ? `Duplicate size "${value.trim()}"` : "");
    update(next);
  }

  function handleStockChange(index: number, value: string) {
    const stock = Math.max(0, parseInt(value, 10) || 0);
    const next = rows.map((r, i) => (i === index ? { ...r, stock } : r));
    update(next);
  }

  function addRow() {
    update([...rows, { size: "", stock: 0 }]);
  }

  function removeRow(index: number) {
    const next = rows.filter((_, i) => i !== index);
    setError("");
    update(next);
  }

  const totalStock = rows.reduce((sum, r) => sum + r.stock, 0);
  const oosCount = rows.filter((r) => r.size.trim() && r.stock === 0).length;

  return (
    <div className="stu-size-stock">
      {rows.length > 0 && (
        <div className="stu-size-stock__header">
          <span className="stu-size-stock__col-label">Size</span>
          <span className="stu-size-stock__col-label">Stock qty</span>
          <span className="stu-size-stock__col-label" />
        </div>
      )}

      <div className="stu-size-stock__rows">
        {rows.map((row, i) => {
          const isOos = row.size.trim() !== "" && row.stock === 0;
          return (
            <div
              key={i}
              className={`stu-size-stock__row ${isOos ? "stu-size-stock__row--oos" : ""}`}
            >
              <input
                type="text"
                className="stu-input stu-size-stock__size-input"
                value={row.size}
                onChange={(e) => handleSizeChange(i, e.target.value)}
                placeholder="e.g. 38, M, Free"
                autoComplete="off"
              />
              <input
                type="number"
                className="stu-input stu-size-stock__stock-input"
                value={row.stock}
                min={0}
                onChange={(e) => handleStockChange(i, e.target.value)}
              />
              <button
                type="button"
                className="stu-size-stock__remove"
                onClick={() => removeRow(i)}
                title="Remove size"
                aria-label={`Remove size ${row.size}`}
              >
                ×
              </button>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        className="stu-btn stu-btn--ghost stu-btn--sm stu-size-stock__add"
        onClick={addRow}
      >
        + Add size
      </button>

      {error && (
        <p className="stu-size-stock__error" role="alert">
          {error}
        </p>
      )}

      {rows.length > 0 && (
        <div className="stu-size-stock__summary">
          <span>
            {totalStock} unit{totalStock !== 1 ? "s" : ""} total
          </span>
          {oosCount > 0 && (
            <span className="stu-size-stock__summary-oos">
              · {oosCount} size{oosCount !== 1 ? "s" : ""} out of stock
            </span>
          )}
        </div>
      )}
    </div>
  );
}
