import Link from "next/link";
import PageHead from "../components/PageHead";
import { requireUser } from "../../../lib/admin/session";
import {
  listAll,
  type ProductReview,
} from "../../../lib/admin/repos/product-reviews";
import { dateShort } from "../../../lib/admin/format";
import { moderateReviewAction, deleteReviewAction } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Reviews · Studio" };

function Stars({ value }: { value: number }) {
  return (
    <span className="stu-stars" aria-label={`${value} star${value === 1 ? "" : "s"}`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= value ? "is-on" : ""} aria-hidden="true">
          ★
        </span>
      ))}
    </span>
  );
}

function StatusPill({ status }: { status: ProductReview["status"] }) {
  return <span className={`stu-pill stu-pill--${status}`}>{status}</span>;
}

export default async function StudioReviewsPage() {
  await requireUser("/studio/login");
  const reviews = await listAll(200);
  const pending = reviews.filter((r) => r.status === "pending");
  const approved = reviews.filter((r) => r.status === "approved");
  const rejected = reviews.filter((r) => r.status === "rejected");

  return (
    <div className="stu-page">
      <PageHead
        title="Reviews"
        sub={`Customer reviews and star ratings. ${pending.length} awaiting moderation.`}
      />

      <section className="stu-card">
        <header className="stu-card__head">
          <h3>Pending ({pending.length})</h3>
        </header>
        <div className="stu-card__body">
          {pending.length === 0 ? (
            <p style={{ color: "var(--ink-3)", margin: 0 }}>No reviews waiting.</p>
          ) : (
            <ReviewList reviews={pending} showApprove showReject showDelete />
          )}
        </div>
      </section>

      <section className="stu-card" style={{ marginTop: "var(--s-5)" }}>
        <header className="stu-card__head">
          <h3>Approved ({approved.length})</h3>
        </header>
        <div className="stu-card__body">
          {approved.length === 0 ? (
            <p style={{ color: "var(--ink-3)", margin: 0 }}>None yet.</p>
          ) : (
            <ReviewList reviews={approved} showReject showDelete />
          )}
        </div>
      </section>

      <section className="stu-card" style={{ marginTop: "var(--s-5)" }}>
        <header className="stu-card__head">
          <h3>Rejected ({rejected.length})</h3>
        </header>
        <div className="stu-card__body">
          {rejected.length === 0 ? (
            <p style={{ color: "var(--ink-3)", margin: 0 }}>None.</p>
          ) : (
            <ReviewList reviews={rejected} showApprove showDelete />
          )}
        </div>
      </section>
    </div>
  );
}

function ReviewList({
  reviews,
  showApprove,
  showReject,
  showDelete,
}: {
  reviews: ProductReview[];
  showApprove?: boolean;
  showReject?: boolean;
  showDelete?: boolean;
}) {
  return (
    <ul className="stu-review-list">
      {reviews.map((r) => (
        <li key={r.id} className="stu-review">
          <div className="stu-review-head">
            <Stars value={r.rating} />
            <StatusPill status={r.status} />
            <Link
              href={`/products/${r.product_slug}`}
              className="stu-review-slug"
              target="_blank"
              rel="noopener"
            >
              /{r.product_slug}
            </Link>
            <span className="stu-review-author">
              {r.customer_name} · {dateShort(r.created_at)}
            </span>
          </div>
          {r.title && <strong className="stu-review-title">{r.title}</strong>}
          <p className="stu-review-body">{r.body}</p>
          <div className="stu-review-actions">
            {showApprove && (
              <form action={moderateReviewAction}>
                <input type="hidden" name="id" value={r.id} />
                <input type="hidden" name="action" value="approved" />
                <button type="submit" className="stu-btn stu-btn--sm">
                  Approve
                </button>
              </form>
            )}
            {showReject && (
              <form action={moderateReviewAction}>
                <input type="hidden" name="id" value={r.id} />
                <input type="hidden" name="action" value="rejected" />
                <button type="submit" className="stu-btn stu-btn--sm">
                  Reject
                </button>
              </form>
            )}
            {showDelete && (
              <form action={deleteReviewAction}>
                <input type="hidden" name="id" value={r.id} />
                <button type="submit" className="stu-btn stu-btn--sm stu-btn--danger">
                  Delete
                </button>
              </form>
            )}
          </div>
        </li>
      ))}
      <style>{`
        .stu-review-list { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--s-4); }
        .stu-review { padding: var(--s-3); border: 1px solid var(--rule); }
        .stu-review-head {
          display: flex; flex-wrap: wrap; align-items: center; gap: var(--s-2);
          margin-bottom: var(--s-2);
          font-family: var(--font-mono); font-size: var(--t-mono-xs); color: var(--ink-3);
        }
        .stu-review-slug { color: var(--ink-2); text-decoration: underline; text-underline-offset: 3px; }
        .stu-review-author { margin-left: auto; }
        .stu-review-title { display: block; margin: 0 0 var(--s-1); }
        .stu-review-body { margin: 0 0 var(--s-3); line-height: 1.55; color: var(--ink); }
        .stu-review-actions { display: flex; gap: var(--s-2); flex-wrap: wrap; }
        .stu-stars { letter-spacing: 1px; color: var(--accent); }
        .stu-stars span:not(.is-on) { color: var(--rule); }
        .stu-pill {
          display: inline-block; padding: 2px 8px;
          font-family: var(--font-mono); font-size: var(--t-mono-xs);
          text-transform: uppercase; letter-spacing: 0.12em;
          border: 1px solid var(--rule);
        }
        .stu-pill--pending  { background: var(--paper-2); }
        .stu-pill--approved { background: var(--ink); color: var(--paper); border-color: var(--ink); }
        .stu-pill--rejected { color: var(--ink-3); }
      `}</style>
    </ul>
  );
}
