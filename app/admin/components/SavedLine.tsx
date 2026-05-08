"use client";
import { useEffect, useState } from "react";

export default function SavedLine({ at }: { at?: string }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 60_000);
    return () => clearInterval(t);
  }, []);
  void tick;
  if (!at) return null;
  const ms = Date.now() - new Date(at).getTime();
  const mins = Math.max(0, Math.round(ms / 60_000));
  const phrase =
    mins === 0 ? "just now" :
    mins === 1 ? "1 min ago" :
    mins < 60  ? `${mins} min ago` :
    mins < 60 * 24 ? `${Math.round(mins / 60)} hr ago` :
    `${Math.round(mins / (60 * 24))} d ago`;
  return (
    <span className="adm-saved-line">
      <span>Stitched · saved</span>
      <em>{phrase}</em>
    </span>
  );
}
