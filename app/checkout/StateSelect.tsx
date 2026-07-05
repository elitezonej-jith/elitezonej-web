"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { INDIAN_STATES } from "@/lib/states";

type Props = {
  name: string;
  defaultValue?: string;
  err?: string;
  onBlur?: (value: string) => void;
};

/**
 * Searchable combobox for Indian states/UTs.
 * Renders a hidden input with the selected value for form submission,
 * and a visible text input for search/filter with a dropdown listbox.
 */
export default function StateSelect({ name, defaultValue = "", err, onBlur }: Props) {
  const [value, setValue] = useState(defaultValue);
  const [query, setQuery] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Filter states based on query
  const filtered = query.trim()
    ? INDIAN_STATES.filter((s) =>
        s.toLowerCase().includes(query.trim().toLowerCase()),
      )
    : INDIAN_STATES;

  // Reset focused index when filtered list changes
  useEffect(() => {
    setFocused(-1);
  }, [query]);

  // Scroll active item into view
  useEffect(() => {
    if (focused < 0 || !listRef.current) return;
    const item = listRef.current.children[focused] as HTMLElement | undefined;
    item?.scrollIntoView({ block: "nearest" });
  }, [focused]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const select = useCallback(
    (state: string) => {
      setValue(state);
      setQuery(state);
      setOpen(false);
      inputRef.current?.focus();
      onBlur?.(state);
    },
    [onBlur],
  );

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
      } else {
        setFocused((f) => (f < filtered.length - 1 ? f + 1 : 0));
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (open) {
        setFocused((f) => (f > 0 ? f - 1 : filtered.length - 1));
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (open && focused >= 0 && filtered[focused]) {
        select(filtered[focused]);
      }
    } else if (e.key === "Escape") {
      if (open) {
        e.preventDefault();
        setOpen(false);
        // Restore the selected value text
        setQuery(value);
      }
    } else if (e.key === "Tab") {
      if (open) {
        setOpen(false);
        // If there's exactly one match, auto-select it
        if (filtered.length === 1) {
          select(filtered[0]);
        } else {
          setQuery(value);
        }
      }
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setQuery(v);
    if (!open) setOpen(true);
    // If text exactly matches a state, select it immediately
    const exact = INDIAN_STATES.find(
      (s) => s.toLowerCase() === v.trim().toLowerCase(),
    );
    if (exact) {
      setValue(exact);
    } else {
      // Clear value if user is typing a non-exact string
      setValue("");
    }
  }

  function handleFocus() {
    setOpen(true);
    // Select all text on focus for easy replacement
    inputRef.current?.select();
  }

  function handleBlurInternal() {
    // Delay to allow click events on options to fire first
    setTimeout(() => {
      if (!wrapRef.current?.contains(document.activeElement)) {
        setOpen(false);
        // If current query doesn't match a valid state, reset to last valid
        if (!INDIAN_STATES.includes(query)) {
          setQuery(value);
        }
        onBlur?.(value);
      }
    }, 150);
  }

  const errId = `err-${name}`;
  const listId = `${name}-listbox`;

  return (
    <div className="state-select" ref={wrapRef}>
      {/* Hidden input carries the actual value for form submission */}
      <input type="hidden" name={name} value={value} />

      <div style={{ display: "grid", gap: 4 }}>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlurInternal}
          onKeyDown={handleKeyDown}
          placeholder="State"
          autoComplete="off"
          role="combobox"
          aria-expanded={open && filtered.length > 0}
          aria-controls={listId}
          aria-activedescendant={
            focused >= 0 ? `${name}-opt-${focused}` : undefined
          }
          aria-invalid={err ? true : undefined}
          aria-describedby={err ? errId : undefined}
          aria-label="State"
          aria-autocomplete="list"
        />
        <span
          id={errId}
          role="alert"
          className="t-mono-xs"
          style={{ color: "var(--error)", minHeight: "1em", lineHeight: 1.1 }}
        >
          {err ?? ""}
        </span>
      </div>

      {open && filtered.length > 0 && (
        <ul
          ref={listRef}
          id={listId}
          className="state-select__list"
          role="listbox"
          aria-label="Indian states and union territories"
        >
          {filtered.map((state, i) => (
            <li
              key={state}
              id={`${name}-opt-${i}`}
              className="state-select__option"
              role="option"
              aria-selected={i === focused}
              data-active={i === focused || undefined}
              data-selected={state === value || undefined}
              onMouseDown={(e) => {
                e.preventDefault(); // Prevent blur before selection
                select(state);
              }}
            >
              {state}
            </li>
          ))}
        </ul>
      )}

      {open && query.trim() && filtered.length === 0 && (
        <div className="state-select__empty">
          No matching state
        </div>
      )}
    </div>
  );
}
