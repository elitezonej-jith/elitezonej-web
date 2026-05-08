import Link from "next/link";

export default function Folio({
  page, pages, baseHref, total, itemLabel = "items",
}: {
  page: number; pages: number; baseHref: string;
  total: number; itemLabel?: string;
}) {
  const safe = Math.max(1, pages);
  const link = (p: number) => {
    const sep = baseHref.includes("?") ? "&" : "?";
    return `${baseHref}${sep}page=${p}`;
  };
  return (
    <div className="stu-folio">
      <span className="stu-folio__count">
        Page <strong>{page}</strong> of {safe} · {total} {itemLabel}
      </span>
      <span className="stu-folio__nav">
        <Link
          href={page > 1 ? link(page - 1) : "#"}
          className={`stu-btn stu-btn--ghost stu-btn--sm ${page <= 1 ? "is-disabled" : ""}`}
          aria-disabled={page <= 1}
        >
          ← Previous
        </Link>
        <Link
          href={page < safe ? link(page + 1) : "#"}
          className={`stu-btn stu-btn--ghost stu-btn--sm ${page >= safe ? "is-disabled" : ""}`}
          aria-disabled={page >= safe}
        >
          Next →
        </Link>
      </span>
    </div>
  );
}
