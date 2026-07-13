"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PageJump({
  current,
  total,
  baseHref,
}: {
  current: number;
  total: number;
  baseHref: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState("");

  const go = () => {
    const n = parseInt(value, 10);
    if (!n || n < 1 || n > total || n === current) {
      setValue("");
      return;
    }
    const sep = baseHref.includes("?") ? "&" : "?";
    router.push(`${baseHref}${sep}page=${n}`);
    setValue("");
  };

  return (
    <span className="stu-folio__jump">
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={value}
        onChange={(e) => setValue(e.target.value.replace(/\D/g, ""))}
        onKeyDown={(e) => { if (e.key === "Enter") go(); }}
        placeholder={`/${total}`}
        aria-label={`Go to page (1–${total})`}
        className="stu-folio__jump-input"
      />
      <button
        type="button"
        onClick={go}
        className="stu-folio__jump-btn"
        aria-label="Go to page"
      >
        Go
      </button>
    </span>
  );
}
