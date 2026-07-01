"use client";
import { useRef, useState } from "react";
import { updateFabricStockAction } from "../actions/inventory";

const FABRIC_LOW_THRESHOLD = 5; // metres

export default function FabricStockCell({ slug, colourId, colourName, hex, stockMeters }: {
  slug: string;
  colourId: number;
  colourName: string;
  hex: string;
  stockMeters: number;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [saved, setSaved] = useState(false);
  const [value, setValue] = useState(stockMeters);
  const level = value === 0 ? "oos" : value <= FABRIC_LOW_THRESHOLD ? "low" : "ok";

  async function handleSave(fd: FormData) {
    await updateFabricStockAction(fd);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  // Detect light colours for border treatment
  const isLight = (() => {
    const h = hex.replace("#", "");
    if (h.length !== 6) return false;
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return (r * 0.299 + g * 0.587 + b * 0.114) > 200;
  })();

  return (
    <form
      ref={formRef}
      action={handleSave}
      className={`inv-colour inv-colour--${level}`}
    >
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="colour_id" value={colourId} />
      <span
        className={`inv-colour__swatch ${isLight ? "inv-colour__swatch--light" : ""}`}
        style={{ backgroundColor: hex }}
        title={hex}
      />
      <div className="inv-colour__label">{colourName}</div>
      <input
        type="number"
        name="stock_meters"
        value={value}
        min={0}
        step={1}
        className="inv-colour__input"
        onChange={(e) => setValue(Math.max(0, Math.round(Number(e.target.value) || 0)))}
        onBlur={() => {
          if (value !== stockMeters) formRef.current?.requestSubmit();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") { e.preventDefault(); formRef.current?.requestSubmit(); }
        }}
      />
      <span className="inv-colour__unit">m</span>
      {saved && <span className="inv-colour__saving">✓</span>}
    </form>
  );
}
