"use client";
import { useActionState } from "react";
import { inviteUserAction, type ActionState } from "../../admin/actions/auth";

const initial: ActionState = {};

export default function InviteForm() {
  const [state, action, pending] = useActionState(inviteUserAction, initial);
  return (
    <form action={action} className="stu-form">
      <div className="stu-row--3">
        <label className="stu-field"><span className="stu-field__label">Name</span>
          <input name="name" required minLength={2} className="stu-input" /></label>
        <label className="stu-field"><span className="stu-field__label">Email</span>
          <input name="email" type="email" required className="stu-input" /></label>
        <label className="stu-field"><span className="stu-field__label">Role</span>
          <select name="role" defaultValue="staff" className="stu-select">
            <option value="staff">Staff</option><option value="owner">Owner</option>
          </select></label>
      </div>
      <label className="stu-field"><span className="stu-field__label">Initial password (8+)</span>
        <input name="password" type="text" minLength={8} required className="stu-input"
               style={{ fontFamily: "ui-monospace, monospace" }} /></label>
      {state.error && <p className="stu-form__error">{state.error}</p>}
      {state.ok && <p className="stu-form__ok">Teammate invited.</p>}
      <div>
        <button type="submit" className="stu-btn stu-btn--primary" disabled={pending}>
          {pending ? "Inviting…" : "Send invite"}
        </button>
      </div>
    </form>
  );
}
