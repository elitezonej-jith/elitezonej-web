"use client";
import { useActionState, useState } from "react";
import Link from "next/link";
import type { ProductReview, ReviewAggregate } from "../../../lib/admin/repos/product-reviews";
import { submitReviewAction, type SubmitReviewState } from "./actions";

function Stars({
  value,
  size = 14,
  ariaLabel,
}: {
  value: number;
  size?: number;
  ariaLabel?: string;
}) {
  const full = Math.round(value);
  return (
    <span
      className="rv-stars"
      role={ariaLabel ? "img" : undefined}
      aria-label={ariaLabel}
      style={{ fontSize: size, lineHeight: 1 }}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= full ? "rv-star is-on" : "rv-star"} aria-hidden="true">
          ★
        </span>
      ))}
    </span>
  );
}

function dateShort(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function ReviewsSection({
  slug,
  aggregate,
  reviews,
  canWrite,
}: {
  slug: string;
  aggregate: ReviewAggregate;
  reviews: ProductReview[];
  /** True when there's a signed-in customer; controls whether the write-form
   *  renders or the sign-in CTA. */
  canWrite: boolean;
}) {
  const [state, formAction, pending] = useActionState<SubmitReviewState, FormData>(
    submitReviewAction,
    {},
  );
  const [rating, setRating] = useState(5);

  return (
    <section className="rv">
      <header className="rv-head">
        <h3>Reviews</h3>
        {aggregate.count > 0 ? (
          <div className="rv-summary">
            <Stars
              value={aggregate.avg}
              size={18}
              ariaLabel={`${aggregate.avg.toFixed(1)} out of 5 stars from ${aggregate.count} review${
                aggregate.count === 1 ? "" : "s"
              }`}
            />
            <span className="rv-avg">{aggregate.avg.toFixed(1)}</span>
            <span className="rv-count">
              ({aggregate.count} review{aggregate.count === 1 ? "" : "s"})
            </span>
          </div>
        ) : (
          <p className="rv-empty">No reviews yet — be the first.</p>
        )}
      </header>

      {canWrite ? (
        state.ok ? (
          <div className="rv-thanks" role="status">
            <strong>Thanks for writing.</strong> Your review is awaiting moderation
            and will appear on this page once approved.
          </div>
        ) : (
          <form action={formAction} className="rv-form">
            <input type="hidden" name="slug" value={slug} />
            <input type="hidden" name="rating" value={rating} />

            <div className="rv-form-row">
              <span className="rv-form-label">Your rating</span>
              <div className="rv-rate" role="radiogroup" aria-label="Star rating">
                {[1, 2, 3, 4, 5].map((i) => (
                  <button
                    key={i}
                    type="button"
                    role="radio"
                    aria-checked={rating === i}
                    aria-label={`${i} star${i === 1 ? "" : "s"}`}
                    className={i <= rating ? "rv-rate-btn is-on" : "rv-rate-btn"}
                    onClick={() => setRating(i)}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <label className="rv-form-row">
              <span className="rv-form-label">Title (optional)</span>
              <input
                name="title"
                type="text"
                maxLength={120}
                placeholder="A short summary"
                className="rv-input"
              />
            </label>

            <label className="rv-form-row">
              <span className="rv-form-label">Your review</span>
              <textarea
                name="body"
                rows={4}
                maxLength={2000}
                required
                placeholder="What did you think of the fit, fabric, and finish?"
                className="rv-textarea"
              />
            </label>

            {state.error && (
              <p className="rv-err" role="alert">
                {state.error}
              </p>
            )}

            <button type="submit" className="rv-submit" disabled={pending}>
              {pending ? "Submitting…" : "Submit review"}
            </button>
          </form>
        )
      ) : (
        <p className="rv-signin">
          <Link href={`/login?next=/products/${slug}`}>Sign in</Link> to write a review.
        </p>
      )}

      {reviews.length > 0 && (
        <ul className="rv-list">
          {reviews.map((r) => (
            <li key={r.id} className="rv-item">
              <div className="rv-item-head">
                <Stars value={r.rating} ariaLabel={`${r.rating} out of 5 stars`} />
                {r.title && <strong className="rv-item-title">{r.title}</strong>}
              </div>
              <p className="rv-item-body">{r.body}</p>
              <div className="rv-item-meta">
                <span>{r.customer_name}</span>
                <span aria-hidden="true"> · </span>
                <span>{dateShort(r.created_at)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}

      <style jsx>{`
        .rv {
          margin-top: var(--s-8);
          padding-top: var(--s-6);
          border-top: 1px solid var(--rule);
        }
        .rv-head h3 {
          margin: 0 0 var(--s-2);
          font-family: var(--font-display);
          font-size: var(--t-h3);
          font-weight: 500;
        }
        .rv-summary {
          display: flex;
          align-items: center;
          gap: var(--s-2);
          color: var(--ink-2);
        }
        .rv-avg {
          font-family: var(--font-display);
          font-size: var(--t-h4);
        }
        .rv-count {
          font-family: var(--font-mono);
          font-size: var(--t-mono-xs);
          color: var(--ink-3);
        }
        .rv-empty {
          margin: 0;
          color: var(--ink-3);
          font-style: italic;
        }
        .rv-stars {
          display: inline-flex;
          gap: 1px;
        }
        .rv-star {
          color: var(--rule);
        }
        .rv-star.is-on {
          color: var(--accent);
        }
        .rv-form {
          margin-top: var(--s-5);
          display: grid;
          gap: var(--s-3);
        }
        .rv-form-row {
          display: grid;
          gap: var(--s-1);
        }
        .rv-form-label {
          font-family: var(--font-mono);
          font-size: var(--t-mono-xs);
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--ink-3);
        }
        .rv-rate {
          display: flex;
          gap: var(--s-1);
        }
        .rv-rate-btn {
          appearance: none;
          background: transparent;
          border: 0;
          font-size: 24px;
          line-height: 1;
          color: var(--rule);
          cursor: pointer;
          padding: 0;
        }
        .rv-rate-btn.is-on,
        .rv-rate-btn:hover {
          color: var(--accent);
        }
        .rv-input,
        .rv-textarea {
          width: 100%;
          padding: var(--s-2) var(--s-3);
          font-family: inherit;
          font-size: var(--t-body);
          color: var(--ink);
          background: var(--paper);
          border: 1px solid var(--rule);
          border-radius: 0;
        }
        .rv-textarea {
          resize: vertical;
          min-height: 90px;
        }
        .rv-input:focus-visible,
        .rv-textarea:focus-visible {
          outline: none;
          border-color: var(--ink);
        }
        .rv-submit {
          justify-self: start;
          padding: var(--s-2) var(--s-5);
          font-family: var(--font-mono);
          font-size: var(--t-mono-sm);
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--paper);
          background: var(--ink);
          border: 1px solid var(--ink);
          cursor: pointer;
        }
        .rv-submit:disabled {
          opacity: 0.5;
          cursor: progress;
        }
        .rv-err {
          margin: 0;
          color: var(--accent);
          font-size: var(--t-body-sm);
        }
        .rv-thanks {
          margin-top: var(--s-5);
          padding: var(--s-3) var(--s-4);
          background: var(--paper-2, var(--paper));
          border: 1px solid var(--rule);
          font-size: var(--t-body);
          color: var(--ink-2);
        }
        .rv-signin {
          margin-top: var(--s-5);
          color: var(--ink-3);
          font-size: var(--t-body-sm);
        }
        .rv-signin :global(a) {
          color: var(--ink);
          text-decoration: underline;
          text-underline-offset: 3px;
        }
        .rv-list {
          margin: var(--s-6) 0 0;
          padding: 0;
          list-style: none;
          display: grid;
          gap: var(--s-5);
        }
        .rv-item {
          padding-top: var(--s-4);
          border-top: 1px solid var(--rule);
        }
        .rv-item:first-child {
          border-top: 0;
          padding-top: 0;
        }
        .rv-item-head {
          display: flex;
          align-items: center;
          gap: var(--s-2);
          margin-bottom: var(--s-2);
        }
        .rv-item-title {
          font-family: var(--font-display);
          font-weight: 500;
        }
        .rv-item-body {
          margin: 0 0 var(--s-2);
          color: var(--ink);
          line-height: 1.6;
        }
        .rv-item-meta {
          font-family: var(--font-mono);
          font-size: var(--t-mono-xs);
          letter-spacing: 0.08em;
          color: var(--ink-3);
        }
      `}</style>
    </section>
  );
}
