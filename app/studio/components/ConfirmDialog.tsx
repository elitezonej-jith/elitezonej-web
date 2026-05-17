"use client";
import { useModalA11y } from "../../components/useModalA11y";
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
  const dialogRef = useModalA11y<HTMLDivElement>(open, onClose);

  if (!open) return null;
  return (
    <div className="stu-dialog-overlay" onClick={onClose}>
      <div
        ref={dialogRef}
        className="stu-dialog"
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="stu-confirm-title"
      >
        <div className="stu-dialog__icon"><IconTrash /></div>
        <h3 id="stu-confirm-title" className="stu-dialog__title">{title}</h3>
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
