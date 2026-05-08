import Link from "next/link";

export default function Folio({
  page,
  pages,
  baseHref,
  total,
  itemLabel = "entries",
}: {
  page: number;
  pages: number;
  baseHref: string; // e.g. "/admin/products?status=active"
  total: number;
  itemLabel?: string;
}) {
  const safePages = Math.max(1, pages);
  const prevDisabled = page <= 1;
  const nextDisabled = page >= safePages;
  const link = (p: number) => {
    const sep = baseHref.includes("?") ? "&" : "?";
    return `${baseHref}${sep}page=${p}`;
  };
  const padded = (n: number) => String(n).padStart(2, "0");
  return (
    <div className="adm-folio">
      <span className="adm-folio__count">
        Folio <em>{padded(page)}</em> / {padded(safePages)}
        <span style={{ marginLeft: 16, color: "var(--adm-ink-3)" }}>
          {total} {itemLabel}
        </span>
      </span>
      <span className="adm-folio__nav">
        <Link
          href={prevDisabled ? "#" : link(page - 1)}
          aria-disabled={prevDisabled}
          className="adm-folio__btn"
        >
          ← Prev
        </Link>
        <Link
          href={nextDisabled ? "#" : link(page + 1)}
          aria-disabled={nextDisabled}
          className="adm-folio__btn"
        >
          Next →
        </Link>
      </span>
    </div>
  );
}
