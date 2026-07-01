"use client";
import { useState, useEffect, useCallback } from "react";

export type UndoEntry = {
  id: string;
  message: string;
  revert: () => Promise<void>;
};

type Props = {
  entry: UndoEntry | null;
  onDismiss: () => void;
};

const UNDO_TIMEOUT = 5000;

export default function UndoToast({ entry, onDismiss }: Props) {
  const [visible, setVisible] = useState(false);
  const [reverting, setReverting] = useState(false);

  useEffect(() => {
    if (entry) {
      setVisible(true);
      setReverting(false);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onDismiss, 200); // wait for exit animation
      }, UNDO_TIMEOUT);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [entry, onDismiss]);

  const handleUndo = useCallback(async () => {
    if (!entry || reverting) return;
    setReverting(true);
    try {
      await entry.revert();
    } finally {
      setVisible(false);
      setTimeout(onDismiss, 200);
    }
  }, [entry, reverting, onDismiss]);

  if (!entry) return null;

  return (
    <div className={`inv2-undo ${visible ? "inv2-undo--visible" : ""}`} role="alert" aria-live="polite">
      <span className="inv2-undo__icon">✓</span>
      <span className="inv2-undo__msg">{entry.message}</span>
      <button
        type="button"
        className="inv2-undo__btn"
        onClick={handleUndo}
        disabled={reverting}
      >
        {reverting ? "Reverting…" : "Undo"}
      </button>
    </div>
  );
}
