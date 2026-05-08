"use client";
import { useActionState } from "react";
import { bootstrapOwnerAction, type ActionState } from "../actions/auth";

const initial: ActionState = {};

export default function SetupForm() {
  const [state, formAction, pending] = useActionState(bootstrapOwnerAction, initial);
  return (
    <form action={formAction} className="adm-form adm-form--auth">
      <label className="adm-field">
        <span className="adm-field__label">Operator name</span>
        <input
          name="name"
          required
          minLength={2}
          autoFocus
          className="adm-field__input"
          placeholder="Aman Sharma"
        />
      </label>
      <label className="adm-field">
        <span className="adm-field__label">Email</span>
        <input
          name="email"
          type="email"
          required
          className="adm-field__input"
          placeholder="atelier@elitezonej.com"
        />
      </label>
      <label className="adm-field">
        <span className="adm-field__label">Passphrase · 8+ chars</span>
        <input
          name="password"
          type="password"
          required
          minLength={8}
          className="adm-field__input"
        />
      </label>

      {state.error && <p className="adm-form__error" role="alert">{state.error}</p>}

      <button type="submit" className="adm-btn adm-btn--primary" disabled={pending}>
        {pending ? "Inscribing…" : "Open the workbook"}
      </button>
    </form>
  );
}
