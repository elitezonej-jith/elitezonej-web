"use client";
import { useRef, useState } from "react";
import { updateStockAction } from "../actions/inventory";

export default function StockEditor({ slug, size, stock, threshold }: {
  slug: string; size: string; stock: number; threshold: number;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [saved, setSaved] = useState(false);
  const [value, setValue] = useState(stock);
  const level = value === 0 ? "oos" : value <= threshold ? "low" : "ok";

  async function handleSave(fd: FormData) {
    await updateStockAction(fd);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <form
      ref={formRef}
      action={handleSave}
      className={`inv-size inv-size--${level}`}
    >
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="size" value={size} />
      <div className="inv-size__label">{size}</div>
      <input
        type="number"
        name="stock"
        value={value}
        min={0}
        className="inv-size__input"
        onChange={(e) => setValue(Math.max(0, Number(e.target.value) || 0))}
        onBlur={() => {
          if (value !== stock) formRef.current?.requestSubmit();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") { e.preventDefault(); formRef.current?.requestSubmit(); }
        }}
      />
      {saved && <span className="inv-size__saving">✓</span>}
    </form>
  );
}
