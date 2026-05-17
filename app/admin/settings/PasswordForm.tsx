"use client";
import { useActionState } from "react";
import { changePasswordAction, type ActionState } from "../actions/auth";

const initial: ActionState = {};

export default function PasswordForm() {
  const [state, action, pending] = useActionState(changePasswordAction, initial);
  return (
    <form action={action} className="adm-panel">
      <div className="adm-field__row">
        <label className="adm-field">
          <span className="adm-field__label">Current passphrase</span>
          <input name="current" type="password" required autoComplete="current-password" className="adm-field__input" />
        </label>
        <label className="adm-field">
          <span className="adm-field__label">New passphrase · 8+ chars</span>
          <input name="next" type="password" required minLength={8} autoComplete="new-password" className="adm-field__input" />
        </label>
      </div>
      {state.error && <p role="alert" className="adm-form__error">{state.error}</p>}
      {state.ok && <p className="adm-form__ok">Stitched. Your passphrase is updated.</p>}
      <div style={{ marginTop: 16 }}>
        <button type="submit" className="adm-btn adm-btn--ghost" disabled={pending}>
          {pending ? "Stitching…" : "Update passphrase"}
        </button>
      </div>
    </form>
  );
}
