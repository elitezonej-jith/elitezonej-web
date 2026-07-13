import Link from "next/link";
import PageJump from "./PageJump";

/**
 * Compute which page numbers to show.
 * ≤7 pages → show all. Otherwise: first, last, and ±1 window around current with ellipses.
 */
function getPageNumbers(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | "…")[] = [];
  pages.push(1);

  if (current > 3) {
    pages.push("…");
  }

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 2) {
    pages.push("…");
  }

  pages.push(total);
  return pages;
}

export default function Folio({
  page, pages, baseHref, total, itemLabel = "items",
}: {
  page: number; pages: number; baseHref: string;
  total: number; itemLabel?: string;
}) {
  const safe = Math.max(1, pages);
  if (safe <= 1) return null; // No pagination needed for single page

  const link = (p: number) => {
    const sep = baseHref.includes("?") ? "&" : "?";
    return `${baseHref}${sep}page=${p}`;
  };

  const nums = getPageNumbers(page, safe);

  return (
    <div className="stu-folio">
      <span className="stu-folio__count">
        {total} {itemLabel}
      </span>

      <nav className="stu-folio__nav" aria-label="Pagination">
        {/* Previous arrow */}
        <Link
          href={page > 1 ? link(page - 1) : "#"}
          className={`stu-folio__arrow${page <= 1 ? " is-disabled" : ""}`}
          aria-disabled={page <= 1}
          aria-label="Previous page"
          tabIndex={page <= 1 ? -1 : undefined}
        >
          ←
        </Link>

        {/* Page numbers */}
        {nums.map((n, i) =>
          n === "…" ? (
            <span key={`e${i}`} className="stu-folio__ellipsis" aria-hidden="true">…</span>
          ) : (
            <Link
              key={n}
              href={link(n)}
              className={`stu-folio__num${n === page ? " is-current" : ""}`}
              aria-current={n === page ? "page" : undefined}
            >
              {n}
            </Link>
          ),
        )}

        {/* Next arrow */}
        <Link
          href={page < safe ? link(page + 1) : "#"}
          className={`stu-folio__arrow${page >= safe ? " is-disabled" : ""}`}
          aria-disabled={page >= safe}
          aria-label="Next page"
          tabIndex={page >= safe ? -1 : undefined}
        >
          →
        </Link>

        {/* Direct page jump */}
        <PageJump current={page} total={safe} baseHref={baseHref} />
      </nav>
    </div>
  );
}
