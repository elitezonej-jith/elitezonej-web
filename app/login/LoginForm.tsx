"use client";
import Link from "next/link";
import { useActionState } from "react";
import { signInAction, type AuthState } from "../account/actions";

const initial: AuthState = {};

export default function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(signInAction, initial);
  return (
    <form className="auth-form" action={action} noValidate>
      {next && <input type="hidden" name="next" value={next} />}
      <div>
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" defaultValue={state.values?.email ?? ""} required aria-invalid={state.error ? true : undefined} aria-describedby={state.error ? "auth-err" : undefined} />
      </div>
      <div>
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required aria-invalid={state.error ? true : undefined} aria-describedby={state.error ? "auth-err" : undefined} />
      </div>
      {state.error && <p id="auth-err" className="auth-err" role="alert">{state.error}</p>}
      <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
      <p className="auth-alt">
        New here? <Link href={next ? `/signup?next=${encodeURIComponent(next)}` : "/signup"}>Create an account</Link>
      </p>
    </form>
  );
}
