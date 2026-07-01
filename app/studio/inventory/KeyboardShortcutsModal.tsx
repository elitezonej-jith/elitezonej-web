"use client";
import { useEffect, useRef } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
};

const shortcuts = [
  { keys: ["/"], description: "Focus search" },
  { keys: ["Esc"], description: "Clear search / close modal" },
  { keys: ["?"], description: "Show this help" },
  { keys: ["Tab"], description: "Move to next stock cell" },
  { keys: ["Shift", "Tab"], description: "Move to previous cell" },
  { keys: ["Enter"], description: "Save current cell" },
  { keys: ["Esc"], description: "Revert cell to original value" },
  { keys: ["↑", "↓"], description: "Previous / next page" },
];

export default function KeyboardShortcutsModal({ open, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (open) {
      ref.current?.showModal();
    } else {
      ref.current?.close();
    }
  }, [open]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape" && open) {
        e.preventDefault();
        onClose();
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <dialog ref={ref} className="inv2-shortcuts" onClick={(e) => { if (e.target === ref.current) onClose(); }}>
      <div className="inv2-shortcuts__content">
        <div className="inv2-shortcuts__header">
          <h2 className="inv2-shortcuts__title">Keyboard shortcuts</h2>
          <button type="button" className="inv2-shortcuts__close" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="inv2-shortcuts__list">
          {shortcuts.map((s, i) => (
            <div key={i} className="inv2-shortcuts__row">
              <div className="inv2-shortcuts__keys">
                {s.keys.map((k, j) => (
                  <span key={j}>
                    <kbd className="inv2-shortcuts__key">{k}</kbd>
                    {j < s.keys.length - 1 && <span className="inv2-shortcuts__plus">+</span>}
                  </span>
                ))}
              </div>
              <span className="inv2-shortcuts__desc">{s.description}</span>
            </div>
          ))}
        </div>
        <p className="inv2-shortcuts__hint">Press <kbd className="inv2-shortcuts__key">?</kbd> anytime to show this</p>
      </div>
    </dialog>
  );
}
