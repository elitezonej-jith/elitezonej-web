"use client";
import { useActionState } from "react";
import { signInAction, type ActionState } from "../actions/auth";

const initial: ActionState = {};

export default function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(signInAction, initial);
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
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="adm-field__input"
        />
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
