"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";

type ToastKind = "success" | "error" | "info";
type Toast = { id: number; message: string; kind: ToastKind };

const ToastCtx = createContext<{ show: (msg: string, kind?: ToastKind) => void } | null>(null);

let nextId = 1;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const show = useCallback((message: string, kind: ToastKind = "success") => {
    const id = nextId++;
    setToasts((t) => [...t, { id, message, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);
  return (
    <ToastCtx.Provider value={{ show }}>
      {children}
      {toasts.map((t) => (
        <div
          key={t.id}
          role={t.kind === "error" ? "alert" : "status"}
          aria-live={t.kind === "error" ? "assertive" : "polite"}
          className={`stu-toast ${t.kind === "success" ? "stu-toast--success" : t.kind === "error" ? "stu-toast--error" : ""}`}
        >
          {t.message}
        </div>
      ))}
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  return ctx ?? { show: () => {} };
}

// Lightweight: read a 'flash' query param and toast it once on mount.
export function FlashToast({ flash }: { flash?: string }) {
  const { show } = useToast();
  useEffect(() => {
    if (flash) show(decodeURIComponent(flash), "success");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
