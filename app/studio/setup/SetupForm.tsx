"use client";
import { useActionState } from "react";
import { bootstrapStudioOwnerAction, type AuthState } from "../actions/auth";

const initial: AuthState = {};

export default function SetupForm() {
  const [state, action, pending] = useActionState(bootstrapStudioOwnerAction, initial);
  return (
    <form action={action} className="stu-form">
      <label className="stu-field">
        <span className="stu-field__label">Your name</span>
        <input name="name" required minLength={2} autoFocus className="stu-input" placeholder="e.g. Aman Sharma" />
      </label>
      <label className="stu-field">
        <span className="stu-field__label">Email</span>
        <input name="email" type="email" required className="stu-input" placeholder="you@example.com" />
      </label>
      <label className="stu-field">
        <span className="stu-field__label">Password
          <span className="stu-field__hint">at least 8 characters</span>
        </span>
        <input name="password" type="password" required minLength={8} className="stu-input" />
      </label>
      {state.error && <p className="stu-form__error">{state.error}</p>}
      <button type="submit" className="stu-btn stu-btn--primary stu-btn--lg" disabled={pending}
              style={{ width: "100%" }}>
        {pending ? "Creating account…" : "Create account & continue"}
      </button>
    </form>
  );
}
