"use client";
import { useEffect } from "react";
import { IconTrash } from "./Icons";

export default function ConfirmDialog({
  open, onClose, title, body,
  confirmLabel = "Yes, delete",
  cancelLabel = "Cancel",
  formAction,
  hidden,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  body?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  formAction?: (fd: FormData) => void | Promise<void>;
  hidden?: Record<string, string>;
  onConfirm?: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="stu-dialog-overlay" onClick={onClose}>
      <div className="stu-dialog" onClick={(e) => e.stopPropagation()} role="alertdialog">
        <div className="stu-dialog__icon"><IconTrash /></div>
        <h3 className="stu-dialog__title">{title}</h3>
        {body && <p className="stu-dialog__body">{body}</p>}
        <div className="stu-dialog__row">
          <button type="button" className="stu-btn stu-btn--ghost" onClick={onClose}>{cancelLabel}</button>
          {formAction ? (
            <form action={formAction}>
              {hidden && Object.entries(hidden).map(([k, v]) => (
                <input key={k} type="hidden" name={k} value={v} />
              ))}
              <button type="submit" className="stu-btn stu-btn--danger">{confirmLabel}</button>
            </form>
          ) : (
            <button type="button" className="stu-btn stu-btn--danger" onClick={onConfirm}>{confirmLabel}</button>
          )}
        </div>
      </div>
    </div>
  );
}
