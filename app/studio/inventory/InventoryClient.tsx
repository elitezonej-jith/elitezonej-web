"use client";
import { useState, useCallback } from "react";
import UndoToast, { type UndoEntry } from "./UndoToast";

type Props = {
  threshold: number;
  fabricLow: number;
  children: React.ReactNode;
};

export default function InventoryClient({ children }: Props) {
  const [undoEntry, setUndoEntry] = useState<UndoEntry | null>(null);

  const dismiss = useCallback(() => setUndoEntry(null), []);

  return (
    <>
      <div className="inv2-list-wrap">
        {children}
      </div>
      <UndoToast entry={undoEntry} onDismiss={dismiss} />
    </>
  );
}
