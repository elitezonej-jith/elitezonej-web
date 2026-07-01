"use client";
import { useRef, useState, useCallback } from "react";
import { updateFabricStockAction } from "../actions/inventory";

type Props = {
  slug: string;
  colourId: number;
  colourName: string;
  hex: string;
  stockMeters: number;
  maxMeters?: number;
  onSaved?: (slug: string, colourId: number, newValue: number, oldValue: number) => void;
};

const FABRIC_LOW = 5;

export default function FabricCell({ slug, colourId, colourName, hex, stockMeters, maxMeters = 50, onSaved }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(stockMeters);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(false);
  const committedRef = useRef(stockMeters);

  const severity = value === 0 ? "oos" : value <= FABRIC_LOW ? "low" : "ok";
  const barPercent = Math.min((value / maxMeters) * 100, 100);
  const barColor = severity === "oos" ? "var(--inv-critical)" : severity === "low" ? "var(--inv-low)" : "var(--inv-healthy)";

  // Detect light hex for swatch border
  const isLight = (() => {
    const h = hex.replace("#", "");
    if (h.length !== 6) return false;
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return (r * 0.299 + g * 0.587 + b * 0.114) > 200;
  })();

  const handleSave = useCallback(async (fd: FormData) => {
    const newVal = Math.max(0, Math.round(Number(fd.get("stock_meters") ?? 0)));
    if (newVal === committedRef.current) return;

    const oldVal = committedRef.current;
    committedRef.current = newVal;
    setSaving(true);
    setError(false);

    try {
      await updateFabricStockAction(fd);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
      onSaved?.(slug, colourId, newVal, oldVal);
    } catch {
      setValue(oldVal);
      committedRef.current = oldVal;
      setError(true);
      setTimeout(() => setError(false), 2000);
    } finally {
      setSaving(false);
    }
  }, [slug, colourId, onSaved]);

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
      className={`inv2-cell inv2-cell--fabric inv2-cell--${severity} ${saving ? "inv2-cell--saving" : ""} ${error ? "inv2-cell--error" : ""}`}
    >
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="colour_id" value={colourId} />

      <div className="inv2-cell__head">
        <span
          className={`inv2-cell__swatch ${isLight ? "inv2-cell__swatch--light" : ""}`}
          style={{ backgroundColor: hex }}
          aria-hidden="true"
        />
        <span className="inv2-cell__label">{colourName}</span>
        {saved && <span className="inv2-cell__check" aria-label="Saved">✓</span>}
        {saving && <span className="inv2-cell__spinner" aria-label="Saving" />}
      </div>

      <div className="inv2-cell__value-row">
        <input
          ref={inputRef}
          type="number"
          name="stock_meters"
          className="inv2-cell__input"
          value={value}
          min={0}
          step={1}
          onChange={(e) => setValue(Math.max(0, Math.round(Number(e.target.value) || 0)))}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          aria-label={`Stock for ${colourName}, currently ${value} metres`}
          tabIndex={0}
        />
        <span className="inv2-cell__unit">m</span>
      </div>

      <div className="inv2-cell__bar" aria-hidden="true">
        <div
          className="inv2-cell__bar-fill"
          style={{ width: `${barPercent}%`, backgroundColor: barColor }}
        />
      </div>
    </form>
  );
}
