"use client";
import { useEffect, useRef, useCallback } from "react";

/**
 * Studio form guard — adds:
 * 1. Browser "unsaved changes" warning on navigation/close
 * 2. Cmd+S / Ctrl+S keyboard shortcut to submit the form
 *
 * Usage: const { formRef, markDirty } = useFormGuard();
 *        <form ref={formRef} ...>
 *        <input onChange={() => markDirty()} ...>
 */
export function useFormGuard() {
  const formRef = useRef<HTMLFormElement>(null);
  const dirty = useRef(false);

  const markDirty = useCallback(() => { dirty.current = true; }, []);
  const markClean = useCallback(() => { dirty.current = false; }, []);

  useEffect(() => {
    // Warn on page leave if dirty
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirty.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    // Cmd+S / Ctrl+S to save
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (formRef.current) {
          dirty.current = false; // clear dirty before submit to avoid warning
          formRef.current.requestSubmit();
        }
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return { formRef, markDirty, markClean };
}
