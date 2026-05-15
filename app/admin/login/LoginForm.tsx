"use client";
import { useActionState, useState } from "react";
import { signInAction, type ActionState } from "../actions/auth";

const initial: ActionState = {};

export default function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(signInAction, initial);
  const [showPw, setShowPw] = useState(false);
  return (
    <form action={formAction} className="adm-form adm-form--auth">
      <input type="hidden" name="next" value={next} />

      <label className="adm-field">
        <span className="adm-field__label">Email</span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          autoFocus
          className="adm-field__input"
          placeholder="atelier@elitezonej.com"
        />
      </label>

      <label className="adm-field">
        <span className="adm-field__label">Password</span>
        <span style={{ position: "relative", display: "block" }}>
          <input
            name="password"
            type={showPw ? "text" : "password"}
            autoComplete="current-password"
            required
            className="adm-field__input"
            style={{ paddingRight: 64 }}
          />
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            aria-pressed={showPw}
            aria-label={showPw ? "Hide password" : "Show password"}
            style={{
              position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
              background: "none", border: 0, cursor: "pointer",
              fontFamily: '"JetBrains Mono", monospace', fontSize: 10,
              letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--adm-ink-2)",
            }}
          >
            {showPw ? "Hide" : "Show"}
          </button>
        </span>
      </label>

      {state.error && (
        <p className="adm-form__error" role="alert">{state.error}</p>
      )}

      <button type="submit" className="adm-btn adm-btn--primary" disabled={pending}>
        {pending ? "Verifying…" : "Enter the workbook"}
      </button>

      <p className="adm-form__aside">
        <em>Forgotten the passphrase?</em>
        <span> Ask the atelier owner to reissue from the user ledger.</span>
      </p>
    </form>
  );
}
