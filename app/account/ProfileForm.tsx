"use client";
import { useActionState } from "react";
import { updateProfileAction, type AuthState } from "./actions";

const initial: AuthState = {};

export default function ProfileForm({
  firstName,
  lastName,
  phone,
  city,
}: {
  firstName: string;
  lastName: string;
  phone: string;
  city: string;
}) {
  const [state, action, pending] = useActionState(updateProfileAction, initial);
  return (
    <form className="auth-form" action={action} noValidate>
      <div className="two">
        <div>
          <label htmlFor="first_name">First name</label>
          <input id="first_name" name="first_name" defaultValue={firstName} required />
        </div>
        <div>
          <label htmlFor="last_name">Last name</label>
          <input id="last_name" name="last_name" defaultValue={lastName} required />
        </div>
      </div>
      <div>
        <label htmlFor="phone">Phone</label>
        <input id="phone" name="phone" type="tel" defaultValue={phone} />
      </div>
      <div>
        <label htmlFor="city">City</label>
        <input id="city" name="city" defaultValue={city} />
      </div>
      {state.error && <p className="auth-err" role="alert">{state.error}</p>}
      {state.ok && <p className="auth-sub" role="status" style={{ margin: "4px 0 0" }}>Saved ✓</p>}
      <button type="submit" className="btn btn-secondary btn-block" disabled={pending}>
        {pending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
