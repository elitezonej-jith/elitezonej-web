"use client";
import { useState } from "react";
import { updateCategoryAction, deleteCategoryAction } from "../actions/categories";
import DeedOfAction from "../components/DeedOfAction";
import type { Category } from "../../../lib/admin/types";

export default function CategoryEditor({
  cat,
  parentLabel,
  childCount,
}: {
  cat: Category;
  parentLabel?: string;
  childCount?: number;
}) {
  const [editing, setEditing] = useState(false);
  const [open, setOpen] = useState(false);

  if (editing) {
    return (
      <tr>
        <td colSpan={5}>
          <form action={updateCategoryAction} style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <input type="hidden" name="id" value={cat.id} />
            <input
              name="name"
              defaultValue={cat.name}
              className="adm-field__input"
              style={{ width: 200, padding: 6, border: "1px solid var(--adm-rule)", background: "var(--adm-paper)", fontFamily: "Cormorant Garamond, serif", fontSize: 16, fontStyle: "italic" }}
              required
            />
            <input
              name="slug"
              defaultValue={cat.slug}
              pattern="[a-z0-9-]+"
              className="adm-field__input"
              style={{ width: 180, padding: 6, border: "1px solid var(--adm-rule)", background: "var(--adm-paper)", fontFamily: "JetBrains Mono, monospace", fontSize: 12 }}
              required
            />
            <input
              name="sort_order"
              type="number"
              min={0}
              defaultValue={cat.sort_order}
              style={{ width: 70, padding: 6, border: "1px solid var(--adm-rule)", background: "var(--adm-paper)", textAlign: "right", fontFamily: "JetBrains Mono, monospace" }}
            />
            <button type="submit" className="adm-btn adm-btn--sm adm-btn--primary">Save</button>
            <button type="button" className="adm-btn adm-btn--sm adm-btn--ghost" onClick={() => setEditing(false)}>Cancel</button>
          </form>
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td><span className="adm-tbl__name" style={{ fontStyle: "italic" }}>{cat.name}</span></td>
      <td className="adm-mono">{cat.slug}</td>
      {parentLabel !== undefined && <td className="adm-italic">{parentLabel}</td>}
      {childCount !== undefined && <td>{childCount} sub-entr{childCount === 1 ? "y" : "ies"}</td>}
      <td className="adm-tbl__num">{cat.sort_order}</td>
      <td>
        <button type="button" className="adm-btn adm-btn--sm adm-btn--ghost" onClick={() => setEditing(true)}>Edit</button>
        <button type="button" className="adm-btn adm-btn--sm adm-btn--danger" onClick={() => setOpen(true)} style={{ marginLeft: 6 }}>Delete</button>
      </td>
      <DeedOfAction
        open={open}
        onClose={() => setOpen(false)}
        title={`You are about to delete ${cat.name.toUpperCase()}.`}
        body="This action removes the category and any of its children. Products tagged with this category will not be deleted but will lose the link."
        confirmLabel="Yes, delete"
        formAction={deleteCategoryAction}
        hidden={{ id: String(cat.id) }}
      />
    </tr>
  );
}
