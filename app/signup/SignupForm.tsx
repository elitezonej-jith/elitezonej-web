"use client";
import Link from "next/link";
import { useActionState } from "react";
import { signUpAction, type AuthState } from "../account/actions";

const initial: AuthState = {};

export default function SignupForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(signUpAction, initial);
  const v = state.values ?? {};
  const errProps = state.error
    ? { "aria-invalid": true as const, "aria-describedby": "auth-err" }
    : {};
  return (
    <form className="auth-form" action={action} noValidate>
      {next && <input type="hidden" name="next" value={next} />}
      <div className="two">
        <div>
          <label htmlFor="first_name">First name</label>
          <input id="first_name" name="first_name" autoComplete="given-name" defaultValue={v.first_name ?? ""} required {...errProps} />
        </div>
        <div>
          <label htmlFor="last_name">Last name</label>
          <input id="last_name" name="last_name" autoComplete="family-name" defaultValue={v.last_name ?? ""} required {...errProps} />
        </div>
      </div>
      <div>
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" defaultValue={v.email ?? ""} required {...errProps} />
      </div>
      <div>
        <label htmlFor="phone">Phone (optional)</label>
        <input id="phone" name="phone" type="tel" autoComplete="tel" defaultValue={v.phone ?? ""} {...errProps} />
      </div>
      <div>
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required {...errProps} />
      </div>
      {state.error && <p id="auth-err" className="auth-err" role="alert">{state.error}</p>}
      <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={pending}>
        {pending ? "Creating account…" : "Create account"}
      </button>
      <p className="auth-alt">
        Already have an account?{" "}
        <Link href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"}>Sign in</Link>
      </p>
    </form>
  );
}
