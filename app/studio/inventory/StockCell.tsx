"use client";
import { useRef, useState, useCallback } from "react";
import { updateStockAction } from "../actions/inventory";

type Props = {
  slug: string;
  size: string;
  stock: number;
  threshold: number;
  maxStock?: number;
  onSaved?: (slug: string, size: string, newValue: number, oldValue: number) => void;
};

export default function StockCell({ slug, size, stock, threshold, maxStock = 30, onSaved }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(stock);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(false);
  const committedRef = useRef(stock);

  const severity = value === 0 ? "oos" : value <= threshold ? "low" : "ok";
  const barPercent = Math.min((value / maxStock) * 100, 100);
  const barColor = severity === "oos" ? "var(--inv-critical)" : severity === "low" ? "var(--inv-low)" : "var(--inv-healthy)";

  const handleSave = useCallback(async (fd: FormData) => {
    const newVal = Math.max(0, Number(fd.get("stock") ?? 0));
    if (newVal === committedRef.current) return;

    const oldVal = committedRef.current;
    committedRef.current = newVal;
    setSaving(true);
    setError(false);

    try {
      await updateStockAction(fd);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
      onSaved?.(slug, size, newVal, oldVal);
    } catch {
      // Revert on error
      setValue(oldVal);
      committedRef.current = oldVal;
      setError(true);
      setTimeout(() => setError(false), 2000);
    } finally {
      setSaving(false);
    }
  }, [slug, size, onSaved]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      formRef.current?.requestSubmit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setValue(committedRef.current);
      inputRef.current?.blur();
    }
  }

  function handleBlur() {
    if (value !== committedRef.current) {
      formRef.current?.requestSubmit();
    }
  }

  return (
    <form
      ref={formRef}
      action={handleSave}
      className={`inv2-cell inv2-cell--${severity} ${saving ? "inv2-cell--saving" : ""} ${error ? "inv2-cell--error" : ""}`}
    >
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="size" value={size} />

      <div className="inv2-cell__head">
        <span className="inv2-cell__label">{size}</span>
        {saved && <span className="inv2-cell__check" aria-label="Saved">✓</span>}
        {saving && <span className="inv2-cell__spinner" aria-label="Saving" />}
      </div>

      <input
        ref={inputRef}
        type="number"
        name="stock"
        className="inv2-cell__input"
        value={value}
        min={0}
        onChange={(e) => setValue(Math.max(0, Number(e.target.value) || 0))}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        aria-label={`Stock for size ${size}, currently ${value}`}
        tabIndex={0}
      />

      <div className="inv2-cell__bar" aria-hidden="true">
        <div
          className="inv2-cell__bar-fill"
          style={{ width: `${barPercent}%`, backgroundColor: barColor }}
        />
      </div>
    </form>
  );
}
