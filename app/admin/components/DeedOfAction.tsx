"use client";
import { useEffect, useRef } from "react";

export default function DeedOfAction({
  open,
  onClose,
  title,
  body,
  confirmLabel = "Yes, proceed",
  cancelLabel = "Reconsider",
  onConfirm,
  formAction,
  hidden,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  body?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  formAction?: (formData: FormData) => void | Promise<void>;
  hidden?: Record<string, string>;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="adm-overlay" onClick={onClose}>
      <div className="adm-deed" onClick={(e) => e.stopPropagation()} ref={ref} role="alertdialog">
        <div className="adm-deed__rule" aria-hidden="true" />
        <h3 className="adm-deed__title">{title}</h3>
        {body && <p className="adm-deed__body">{body}</p>}
        <div className="adm-deed__row">
          <button type="button" className="adm-btn adm-btn--ghost" onClick={onClose}>{cancelLabel}</button>
          {formAction ? (
            <form action={formAction}>
              {hidden && Object.entries(hidden).map(([k, v]) => (
                <input key={k} type="hidden" name={k} value={v} />
              ))}
              <button type="submit" className="adm-btn adm-btn--danger">{confirmLabel}</button>
            </form>
          ) : (
            <button type="button" className="adm-btn adm-btn--danger" onClick={onConfirm}>{confirmLabel}</button>
          )}
        </div>
      </div>
    </div>
  );
}
