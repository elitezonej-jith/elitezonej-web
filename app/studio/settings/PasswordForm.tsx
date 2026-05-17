"use client";
import { useActionState } from "react";
import { changePasswordAction, type ActionState } from "../../admin/actions/auth";

const initial: ActionState = {};

export default function PasswordForm() {
  const [state, action, pending] = useActionState(changePasswordAction, initial);
  return (
    <form action={action} className="stu-form">
      <div className="stu-row">
        <label className="stu-field"><span className="stu-field__label">Current password</span>
          <input name="current" type="password" required autoComplete="current-password" className="stu-input" /></label>
        <label className="stu-field"><span className="stu-field__label">New password (8+)</span>
          <input name="next" type="password" required minLength={8} autoComplete="new-password" className="stu-input" /></label>
      </div>
      {state.error && <p role="alert" className="stu-form__error">{state.error}</p>}
      {state.ok && <p className="stu-form__ok">Password updated.</p>}
      <div>
        <button type="submit" className="stu-btn stu-btn--ghost" disabled={pending}>
          {pending ? "Updating…" : "Update password"}
        </button>
      </div>
    </form>
  );
}
