"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from "firebase/auth";
import { auth } from "@/lib/firebase/client";

type Props = {
  phone: string;
  onVerified: (idToken: string) => void;
  onCancel: () => void;
};

/**
 * Firebase Phone OTP verification flow.
 * Shows inline in the checkout when a first-order promo requires phone verification.
 *
 * Flow: Enter phone → Send OTP (via Firebase) → Enter 6-digit code → Verify → return ID token
 */
export default function PhoneVerification({ phone, onVerified, onCancel }: Props) {
  const [step, setStep] = useState<"ready" | "sending" | "code" | "verifying" | "error">("ready");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const confirmRef = useRef<ConfirmationResult | null>(null);
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Cleanup recaptcha on unmount
  useEffect(() => {
    return () => {
      recaptchaRef.current?.clear();
    };
  }, []);

  const sendOtp = useCallback(async () => {
    if (!phone || phone.trim().length < 6) {
      setError("Please enter a valid phone number above.");
      setStep("error");
      return;
    }

    setStep("sending");
    setError("");

    try {
      // Create invisible reCAPTCHA if not already created
      if (!recaptchaRef.current && containerRef.current) {
        recaptchaRef.current = new RecaptchaVerifier(auth, containerRef.current, {
          size: "invisible",
        });
      }

      // Format phone number: ensure it starts with + for Firebase
      let formattedPhone = phone.replace(/\s/g, "").replace(/^0/, "");
      if (!formattedPhone.startsWith("+")) {
        // Assume Indian number if no country code
        if (formattedPhone.length === 10) {
          formattedPhone = `+91${formattedPhone}`;
        } else {
          formattedPhone = `+${formattedPhone}`;
        }
      }

      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, recaptchaRef.current!);
      confirmRef.current = confirmation;
      setStep("code");
    } catch (err) {
      console.error("[phone-verify] Send failed:", err);
      const msg = (err as { code?: string })?.code === "auth/too-many-requests"
        ? "Too many attempts. Please wait a few minutes."
        : "Failed to send OTP. Check the phone number and try again.";
      setError(msg);
      setStep("error");
    }
  }, [phone]);

  const verifyCode = useCallback(async () => {
    if (!confirmRef.current || code.length !== 6) return;

    setStep("verifying");
    setError("");

    try {
      const result = await confirmRef.current.confirm(code);
      const idToken = await result.user.getIdToken();
      onVerified(idToken);
    } catch (err) {
      console.error("[phone-verify] Verify failed:", err);
      setError("Invalid code. Please check and try again.");
      setStep("code");
    }
  }, [code, onVerified]);

  return (
    <div className="phone-verify">
      <div className="phone-verify__header">
        <span className="phone-verify__icon">🔒</span>
        <div>
          <p className="phone-verify__title">Verify your phone to use this discount</p>
          <p className="phone-verify__sub">We&apos;ll send a one-time code to <strong>{phone}</strong></p>
        </div>
      </div>

      {step === "ready" && (
        <div className="phone-verify__actions">
          <button type="button" className="btn btn-primary" onClick={sendOtp}>
            Send verification code
          </button>
          <button type="button" className="phone-verify__cancel" onClick={onCancel}>
            Remove discount
          </button>
        </div>
      )}

      {step === "sending" && (
        <p className="phone-verify__status">Sending code…</p>
      )}

      {step === "code" && (
        <div className="phone-verify__code-form">
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            pattern="[0-9]{6}"
            placeholder="Enter 6-digit code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className="phone-verify__code-input"
            autoFocus
            autoComplete="one-time-code"
          />
          <button
            type="button"
            className="btn btn-primary"
            onClick={verifyCode}
            disabled={code.length !== 6}
          >
            Verify
          </button>
          <button type="button" className="phone-verify__resend" onClick={sendOtp}>
            Resend code
          </button>
        </div>
      )}

      {step === "verifying" && (
        <p className="phone-verify__status">Verifying…</p>
      )}

      {step === "error" && (
        <div className="phone-verify__error-state">
          <p className="phone-verify__error">{error}</p>
          <button type="button" className="btn btn-secondary" onClick={sendOtp}>
            Try again
          </button>
          <button type="button" className="phone-verify__cancel" onClick={onCancel}>
            Remove discount
          </button>
        </div>
      )}

      {error && step === "code" && (
        <p className="phone-verify__error">{error}</p>
      )}

      {/* Invisible reCAPTCHA container */}
      <div ref={containerRef} id="recaptcha-container" />
    </div>
  );
}
