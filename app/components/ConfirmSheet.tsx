"use client";
import { useEffect, useRef } from "react";

type Props = {
  open: boolean;
  title: string;
  body?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmSheet({
  open, title, body,
  confirmLabel = "Confirm", cancelLabel = "Reconsider",
  onConfirm, onCancel,
}: Props) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const prevFocus = document.activeElement as HTMLElement | null;
    confirmRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      prevFocus?.focus?.();
    };
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      role="presentation"
      onClick={onCancel}
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(26,22,19,0.45)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-sheet-title"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--paper, #FAF7F2)",
          maxWidth: 380, width: "100%",
          padding: "28px 26px",
          boxShadow: "0 24px 60px rgba(0,0,0,0.25)",
        }}
      >
        <h2
          id="confirm-sheet-title"
          style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: "italic", fontSize: 26, margin: 0, color: "var(--ink-1, #1A1613)" }}
        >
          {title}
        </h2>
        {body && (
          <p style={{ marginTop: 10, fontSize: 14, color: "var(--ink-2, #55493E)" }}>{body}</p>
        )}
        <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              flex: 1, padding: "11px 14px", background: "none",
              border: "1px solid var(--ink-2, #55493E)", color: "var(--ink-1, #1A1613)",
              fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer",
            }}
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            style={{
              flex: 1, padding: "11px 14px", background: "var(--accent)",
              border: "1px solid var(--accent)", color: "#FAF7F2",
              fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer",
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
