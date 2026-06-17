"use client";

type Props = {
  current: number;
  total: number;
  onChange: (page: number) => void;
};

export default function Pagination({ current, total, onChange }: Props) {
  if (total <= 1) return null;

  const pages: (number | "…")[] = [];
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= current - 1 && i <= current + 1)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "…") {
      pages.push("…");
    }
  }

  return (
    <nav className="pagination" aria-label="Page navigation">
      <button
        className="pg-btn pg-prev"
        disabled={current === 1}
        onClick={() => onChange(current - 1)}
        aria-label="Previous page"
      >
        ←
      </button>
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`e${i}`} className="pg-ellipsis">…</span>
        ) : (
          <button
            key={p}
            className={`pg-btn pg-num${p === current ? " pg-active" : ""}`}
            onClick={() => onChange(p)}
            aria-current={p === current ? "page" : undefined}
            aria-label={`Page ${p}`}
          >
            {p}
          </button>
        )
      )}
      <button
        className="pg-btn pg-next"
        disabled={current === total}
        onClick={() => onChange(current + 1)}
        aria-label="Next page"
      >
        →
      </button>
    </nav>
  );
}
