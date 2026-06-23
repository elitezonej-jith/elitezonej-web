"use client";
import Link from "next/link";
import { useActionState, useState } from "react";
import { signInAction, sendOtpAction, verifyOtpAction, type AuthState, type OtpState } from "../account/actions";

const initialAuth: AuthState = {};
const initialOtp: OtpState = { step: "email" };

export default function LoginForm({ next }: { next?: string }) {
  const [mode, setMode] = useState<"otp" | "password">("otp");
  const [authState, authAction, authPending] = useActionState(signInAction, initialAuth);
  const [otpState, sendAction, sendPending] = useActionState(sendOtpAction, initialOtp);
  const [verifyState, verifyAction, verifyPending] = useActionState(verifyOtpAction, initialOtp);

  // Password mode
  if (mode === "password") {
    return (
      <form className="auth-form" action={authAction} noValidate>
        {next && <input type="hidden" name="next" value={next} />}
        <div>
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" autoComplete="email" defaultValue={authState.values?.email ?? ""} required />
        </div>
        <div>
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" autoComplete="current-password" required />
        </div>
        {authState.error && <p className="auth-err" role="alert">{authState.error}</p>}
        <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={authPending}>
          {authPending ? "Signing in…" : "Sign in with password"}
        </button>
        <p className="auth-alt">
          <button type="button" className="auth-link" onClick={() => setMode("otp")}>Use email code instead</button>
        </p>
        <p className="auth-alt">
          New here? <Link href={next ? `/signup?next=${encodeURIComponent(next)}` : "/signup"}>Create an account</Link>
        </p>
      </form>
    );
  }

  // OTP step 2: verify code
  if (otpState.step === "code" && otpState.email) {
    return (
      <form className="auth-form" action={verifyAction} noValidate>
        <input type="hidden" name="email" value={otpState.email} />
        {next && <input type="hidden" name="next" value={next} />}
        <p className="auth-sub" style={{ marginBottom: 16 }}>
          We sent a 6-digit code to <strong>{otpState.email}</strong>
        </p>
        <div>
          <label htmlFor="code">Verification code</label>
          <input
            id="code"
            name="code"
            type="text"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            autoComplete="one-time-code"
            autoFocus
            required
            placeholder="000000"
            style={{ letterSpacing: "4px", textAlign: "center", fontSize: 20, fontFamily: "monospace" }}
          />
        </div>
        {verifyState.error && <p className="auth-err" role="alert">{verifyState.error}</p>}
        <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={verifyPending}>
          {verifyPending ? "Verifying…" : "Verify & sign in"}
        </button>
        <p className="auth-alt">
          Didn't receive it?{" "}
          <button type="button" className="auth-link" onClick={() => {
            const fd = new FormData();
            fd.set("email", otpState.email!);
            sendAction(fd);
          }}>Resend code</button>
        </p>
      </form>
    );
  }

  // OTP step 1: enter email
  return (
    <form className="auth-form" action={sendAction} noValidate>
      <div>
        <label htmlFor="email">Email address</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={otpState.email ?? ""}
          placeholder="you@example.com"
        />
      </div>
      {otpState.error && <p className="auth-err" role="alert">{otpState.error}</p>}
      <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={sendPending}>
        {sendPending ? "Sending code…" : "Continue with email"}
      </button>
      <p className="auth-alt" style={{ fontSize: 13, color: "var(--ink-3)" }}>
        We'll email you a one-time code — no password needed.
      </p>
      <p className="auth-alt">
        Have a password? <button type="button" className="auth-link" onClick={() => setMode("password")}>Sign in with password</button>
      </p>
      <p className="auth-alt">
        New here? <Link href={next ? `/signup?next=${encodeURIComponent(next)}` : "/signup"}>Create an account</Link>
      </p>
    </form>
  );
}
