"use client";

import { useState } from "react";
import { deleteCategoryAction } from "../../actions/categories";
import type { BlastRadius } from "../../../../lib/admin/repos/categories";

type Props = {
  categoryId: number;
  categoryName: string;
  blastRadius: BlastRadius;
};

export default function DeleteCategory({ categoryId, categoryName, blastRadius }: Props) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"delete_all" | "reparent_children">("delete_all");
  const [submitting, setSubmitting] = useState(false);

  const hasImpact = blastRadius.descendantCount > 0 || blastRadius.productCount > 0 || blastRadius.offerTargetCount > 0;

  return (
    <section className="stu-card stu-card--danger" style={{ marginTop: 32 }}>
      <header className="stu-card__head">
        <h3>Danger zone</h3>
      </header>
      <div className="stu-card__body">
        <p style={{ margin: 0, color: "var(--stu-muted)" }}>
          Deleting a category removes it from the storefront navigation. Products are not deleted — they become uncategorized.
        </p>
        <button
          type="button"
          className="stu-btn stu-btn--danger stu-btn--sm"
          style={{ marginTop: 12 }}
          onClick={() => setOpen(true)}
        >
          Delete this category
        </button>
      </div>

      {open && (
        <div className="stu-overlay" onClick={() => !submitting && setOpen(false)}>
          <div className="stu-sheet" onClick={(e) => e.stopPropagation()} role="alertdialog" aria-labelledby="del-cat-title">
            <h3 id="del-cat-title" className="stu-sheet__title">
              Delete &ldquo;{categoryName}&rdquo;?
            </h3>

            {hasImpact && (
              <div className="del-cat-impact">
                <p className="del-cat-impact__heading">This will also remove:</p>
                <ul className="del-cat-impact__list">
                  {blastRadius.descendantCount > 0 && (
                    <li>
                      {blastRadius.descendantCount} subcategor{blastRadius.descendantCount === 1 ? "y" : "ies"}
                      {blastRadius.descendantNames.length > 0 && blastRadius.descendantNames.length <= 5 && (
                        <span className="del-cat-impact__names"> ({blastRadius.descendantNames.join(", ")})</span>
                      )}
                    </li>
                  )}
                  {blastRadius.filterCount > 0 && (
                    <li>{blastRadius.filterCount} filter{blastRadius.filterCount === 1 ? "" : "s"} and their options</li>
                  )}
                  {blastRadius.offerTargetCount > 0 && (
                    <li>{blastRadius.offerTargetCount} offer targeting rule{blastRadius.offerTargetCount === 1 ? "" : "s"}</li>
                  )}
                </ul>
                {blastRadius.productCount > 0 && (
                  <p className="del-cat-impact__products">
                    <strong>{blastRadius.productCount} product{blastRadius.productCount === 1 ? "" : "s"}</strong> will become uncategorized (not deleted).
                  </p>
                )}
              </div>
            )}

            {!hasImpact && (
              <p style={{ color: "var(--stu-muted)", margin: "12px 0" }}>
                This category has no subcategories, products, or linked offers.
              </p>
            )}

            {blastRadius.hasChildren && (
              <fieldset className="del-cat-mode" style={{ border: 0, padding: 0, margin: "16px 0 0" }}>
                <legend className="del-cat-mode__legend">How should children be handled?</legend>
                <label className="del-cat-mode__option">
                  <input type="radio" name="del-mode" value="delete_all" checked={mode === "delete_all"} onChange={() => setMode("delete_all")} />
                  <span>Delete entire subtree ({blastRadius.descendantCount} categor{blastRadius.descendantCount === 1 ? "y" : "ies"} removed)</span>
                </label>
                <label className="del-cat-mode__option">
                  <input type="radio" name="del-mode" value="reparent_children" checked={mode === "reparent_children"} onChange={() => setMode("reparent_children")} />
                  <span>
                    Move children to {blastRadius.parentName ? `"${blastRadius.parentName}"` : "root level"} and delete only this category
                  </span>
                </label>
              </fieldset>
            )}

            <form
              action={deleteCategoryAction}
              onSubmit={() => setSubmitting(true)}
              className="del-cat-actions"
            >
              <input type="hidden" name="id" value={categoryId} />
              <input type="hidden" name="mode" value={mode} />
              <button
                type="button"
                className="stu-btn stu-btn--ghost"
                onClick={() => setOpen(false)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="stu-btn stu-btn--danger"
                disabled={submitting}
              >
                {submitting ? "Deleting…" : "Delete permanently"}
              </button>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .del-cat-impact {
          margin: 12px 0;
          padding: 12px 16px;
          background: #fff5f5;
          border: 1px solid #fdd;
          border-radius: 4px;
        }
        .del-cat-impact__heading {
          margin: 0 0 6px;
          font-weight: 600;
          font-size: 13px;
          color: #b91c1c;
        }
        .del-cat-impact__list {
          margin: 0;
          padding-left: 20px;
          font-size: 13px;
          color: var(--stu-ink, #1a1a1a);
          line-height: 1.6;
        }
        .del-cat-impact__names {
          color: var(--stu-muted, #666);
          font-size: 12px;
        }
        .del-cat-impact__products {
          margin: 8px 0 0;
          font-size: 13px;
        }
        .del-cat-mode__legend {
          font-weight: 600;
          font-size: 13px;
          margin-bottom: 8px;
        }
        .del-cat-mode__option {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          margin: 6px 0;
          font-size: 13px;
          cursor: pointer;
          line-height: 1.4;
        }
        .del-cat-mode__option input {
          margin-top: 3px;
        }
        .del-cat-actions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          margin-top: 20px;
          padding-top: 16px;
          border-top: 1px solid #eee;
        }
      `}</style>
    </section>
  );
}
