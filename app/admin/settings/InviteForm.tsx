"use client";
import { useActionState } from "react";
import { inviteUserAction, type ActionState } from "../actions/auth";

const initial: ActionState = {};

export default function InviteForm() {
  const [state, action, pending] = useActionState(inviteUserAction, initial);
  return (
    <form action={action} className="adm-panel">
      <div className="adm-field__row--3">
        <label className="adm-field">
          <span className="adm-field__label">Name</span>
          <input name="name" required minLength={2} className="adm-field__input" />
        </label>
        <label className="adm-field">
          <span className="adm-field__label">Email</span>
          <input name="email" type="email" required className="adm-field__input" />
        </label>
        <label className="adm-field">
          <span className="adm-field__label">Role</span>
          <select name="role" defaultValue="staff" className="adm-field__select">
            <option value="staff">Staff</option>
            <option value="owner">Owner</option>
          </select>
        </label>
      </div>
      <label className="adm-field">
        <span className="adm-field__label">Initial passphrase · share securely</span>
        <input name="password" type="text" minLength={8} required className="adm-field__input"
               style={{ fontFamily: "JetBrains Mono, monospace" }} />
      </label>
      {state.error && <p role="alert" className="adm-form__error">{state.error}</p>}
      {state.ok && <p className="adm-form__ok">Inscribed. The new operator can sign in.</p>}
      <div style={{ marginTop: 16 }}>
        <button type="submit" className="adm-btn adm-btn--primary" disabled={pending}>
          {pending ? "Inviting…" : "Invite operator"}
        </button>
      </div>
    </form>
  );
}
