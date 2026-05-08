"use client";
import { useActionState } from "react";
import { signInStudioAction, type AuthState } from "../actions/auth";

const initial: AuthState = {};

export default function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(signInStudioAction, initial);
  return (
    <form action={action} className="stu-form">
      <input type="hidden" name="next" value={next} />
      <label className="stu-field">
        <span className="stu-field__label">Email</span>
        <input name="email" type="email" required autoFocus autoComplete="email"
               className="stu-input" placeholder="you@example.com" />
      </label>
      <label className="stu-field">
        <span className="stu-field__label">Password</span>
        <input name="password" type="password" required autoComplete="current-password"
               className="stu-input" placeholder="••••••••" />
      </label>
      {state.error && <p className="stu-form__error">{state.error}</p>}
      <button type="submit" className="stu-btn stu-btn--primary stu-btn--lg" disabled={pending}
              style={{ width: "100%" }}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
