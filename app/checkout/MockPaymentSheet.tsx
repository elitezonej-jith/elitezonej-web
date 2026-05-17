"use client";
import { useEffect, useRef, useState } from "react";
import { fmtINR } from "@/lib/format";
import { confirmMockPayment } from "./actions";

type Method = "card" | "upi";
type Phase = "idle" | "stitching" | "sealed" | "error";

export default function MockPaymentSheet({
  orderId,
  token,
  amount,
  email,
  onSuccess,
  onClose,
}: {
  orderId: string;
  token: string;
  amount: number;
  email?: string;
  onSuccess: (orderId: string) => void;
  onClose: () => void;
}) {
  const [method, setMethod] = useState<Method>("card");
  const [phase, setPhase] = useState<Phase>("idle");
  const [err, setErr] = useState<string | null>(null);
  const [card, setCard] = useState("");
  const [exp, setExp] = useState("");
  const [cvv, setCvv] = useState("");
  const [upi, setUpi] = useState("");
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Body scroll-lock + Escape to dismiss + initial focus.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => firstFieldRef.current?.focus(), 320);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && phase !== "stitching" && phase !== "sealed") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose, phase]);

  const busy = phase === "stitching" || phase === "sealed";

  async function pay() {
    setErr(null);
    setPhase("stitching");
    // Let the seam "sew" before the server settles — pure theatre, but the
    // confirm itself is a real, idempotent server action.
    const settle = confirmMockPayment({ orderId, token });
    await new Promise((r) => setTimeout(r, 2100));
    const res = await settle;
    if (res.ok) {
      setPhase("sealed");
      setTimeout(() => onSuccess(res.orderId ?? orderId), 1450);
    } else {
      setErr(res.error ?? "Payment could not be completed.");
      setPhase("error");
    }
  }

  return (
    <div
      className="mps-scrim"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className="mps"
        role="dialog"
        aria-modal="true"
        aria-label="Secure payment — sandbox"
      >
        <span className="mps-ribbon" aria-hidden="true">
          SANDBOX · TEST MODE · NO REAL CHARGE
        </span>

        <header className="mps-head">
          <div className="mps-mark">
            <span className="mps-mark__rule" aria-hidden="true" />
            <span className="mps-mark__name">Elite Zone J</span>
            <span className="mps-mark__sub">Atelier Payments</span>
          </div>
          <button
            className="mps-x"
            onClick={onClose}
            disabled={busy}
            aria-label="Close payment"
          >
            ✕
          </button>
        </header>

        <div className="mps-amount">
          <span className="mps-amount__label">Amount due</span>
          <span className="mps-amount__val">{fmtINR(amount)}</span>
          <span className="mps-amount__meta">
            Order {orderId}
            {email ? ` · ${email}` : ""}
          </span>
        </div>

        {phase !== "sealed" ? (
          <>
            <div className="mps-seg" role="tablist" aria-label="Payment method">
              {(["card", "upi"] as Method[]).map((m) => (
                <button
                  key={m}
                  role="tab"
                  aria-selected={method === m}
                  className={`mps-seg__btn${method === m ? " is-on" : ""}`}
                  onClick={() => setMethod(m)}
                  disabled={busy}
                >
                  {m === "card" ? "Card" : "UPI"}
                </button>
              ))}
              <span
                className="mps-seg__ink"
                style={{ transform: `translateX(${method === "card" ? "0" : "100%"})` }}
                aria-hidden="true"
              />
            </div>

            <div className="mps-fields">
              {method === "card" ? (
                <>
                  <label className="mps-field">
                    <span>Card number</span>
                    <input
                      ref={firstFieldRef}
                      inputMode="numeric"
                      placeholder="4111 1111 1111 1111"
                      value={card}
                      disabled={busy}
                      onChange={(e) =>
                        setCard(
                          e.target.value
                            .replace(/\D/g, "")
                            .slice(0, 16)
                            .replace(/(.{4})/g, "$1 ")
                            .trim(),
                        )
                      }
                    />
                  </label>
                  <div className="mps-row">
                    <label className="mps-field">
                      <span>Expiry</span>
                      <input
                        inputMode="numeric"
                        placeholder="MM / YY"
                        value={exp}
                        disabled={busy}
                        onChange={(e) => {
                          const d = e.target.value.replace(/\D/g, "").slice(0, 4);
                          setExp(d.length > 2 ? `${d.slice(0, 2)} / ${d.slice(2)}` : d);
                        }}
                      />
                    </label>
                    <label className="mps-field">
                      <span>CVV</span>
                      <input
                        inputMode="numeric"
                        placeholder="•••"
                        value={cvv}
                        disabled={busy}
                        onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      />
                    </label>
                  </div>
                </>
              ) : (
                <label className="mps-field">
                  <span>UPI ID</span>
                  <input
                    ref={firstFieldRef}
                    placeholder="yourname@bank"
                    value={upi}
                    disabled={busy}
                    onChange={(e) => setUpi(e.target.value)}
                  />
                </label>
              )}

              <p className="mps-hint">
                Sandbox — enter anything, or leave blank. No card is charged. Drop
                live Razorpay keys into the environment and this screen is
                replaced by the real gateway automatically.
              </p>
            </div>

            {/* The running-stitch seam — sews shut while processing */}
            <div className={`mps-seam${phase === "stitching" ? " is-sewing" : ""}`} aria-hidden="true">
              <svg viewBox="0 0 600 24" preserveAspectRatio="none">
                <line className="mps-seam__guide" x1="8" y1="12" x2="592" y2="12" />
                <line className="mps-seam__thread" x1="8" y1="12" x2="592" y2="12" />
                <circle className="mps-seam__needle" cx="8" cy="12" r="3.4" />
              </svg>
            </div>

            {err && (
              <p className="mps-err" role="alert">
                {err}
              </p>
            )}

            <button
              className="mps-pay"
              onClick={pay}
              disabled={busy}
              aria-busy={phase === "stitching"}
            >
              <span>
                {phase === "stitching"
                  ? "Stitching your order…"
                  : `Pay ${fmtINR(amount)}`}
              </span>
            </button>

            <p className="mps-foot">
              Secured by the Elite Zone J atelier desk · 256-bit theatre
            </p>
          </>
        ) : (
          <div className="mps-done" role="status" aria-live="polite">
            <span className="mps-seal" aria-hidden="true">
              <svg viewBox="0 0 120 120">
                <circle className="mps-seal__ring" cx="60" cy="60" r="50" />
                <circle className="mps-seal__ring2" cx="60" cy="60" r="40" />
                <path className="mps-seal__tick" d="M40 62 L54 76 L82 44" />
              </svg>
            </span>
            <h3>Payment received</h3>
            <p>
              Order <b>{orderId}</b> is confirmed. Redirecting to your receipt…
            </p>
          </div>
        )}
      </div>

      <style jsx>{`
        .mps-scrim {
          position: fixed;
          inset: 0;
          z-index: 120;
          display: grid;
          place-items: center;
          padding: 20px;
          background:
            radial-gradient(120% 120% at 50% 0%, rgba(28, 22, 16, 0.42), rgba(20, 16, 12, 0.7));
          backdrop-filter: blur(6px) saturate(0.9);
          animation: mps-fade 0.4s ease both;
        }
        .mps {
          position: relative;
          width: min(440px, 100%);
          max-height: calc(100dvh - 40px);
          overflow-y: auto;
          overscroll-behavior: contain;
          padding: 30px 30px 24px;
          color: #1c1812;
          background-color: #f3ede1;
          background-image:
            linear-gradient(180deg, rgba(255, 255, 255, 0.55), rgba(255, 255, 255, 0) 30%),
            url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='90' height='90'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='2'/><feColorMatrix type='matrix' values='0 0 0 0 0.12 0 0 0 0 0.10 0 0 0 0 0.07 0 0 0 0.45 0'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.05'/></svg>");
          border: 1px solid #ddd2bd;
          box-shadow:
            0 1px 0 rgba(255, 255, 255, 0.6) inset,
            0 40px 90px -30px rgba(28, 20, 12, 0.7);
          animation: mps-rise 0.55s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .mps-ribbon {
          position: absolute;
          top: 30px;
          right: -1px;
          writing-mode: vertical-rl;
          padding: 14px 5px;
          font-family: var(--font-mono, ui-monospace, monospace);
          font-size: 9px;
          letter-spacing: 0.34em;
          color: #6f5a3a;
          background: linear-gradient(180deg, #d8c188, #b9975a);
          border: 1px solid #a8895c;
          border-right: 0;
          text-transform: uppercase;
        }
        .mps-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          padding-right: 26px;
        }
        .mps-mark__rule {
          display: block;
          width: 34px;
          height: 2px;
          background: #9c7c4f;
          margin-bottom: 12px;
        }
        .mps-mark__name {
          display: block;
          font-family: var(--font-display, "Libre Baskerville", Georgia, serif);
          font-size: 22px;
          letter-spacing: 0.01em;
        }
        .mps-mark__sub {
          display: block;
          margin-top: 3px;
          font-family: var(--font-mono, ui-monospace, monospace);
          font-size: 9.5px;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          color: #8a7858;
        }
        .mps-x {
          appearance: none;
          border: 1px solid #cdbfa3;
          background: transparent;
          width: 30px;
          height: 30px;
          color: #5f5341;
          font-size: 12px;
          cursor: pointer;
          transition: background 0.2s, color 0.2s;
        }
        .mps-x:hover:not(:disabled) {
          background: #1c1812;
          color: #f3ede1;
        }
        .mps-x:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }
        .mps-amount {
          margin: 26px 0 22px;
          padding-bottom: 18px;
          border-bottom: 1px dashed #c9bca0;
        }
        .mps-amount__label {
          display: block;
          font-family: var(--font-mono, ui-monospace, monospace);
          font-size: 9.5px;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: #8a7858;
        }
        .mps-amount__val {
          display: block;
          margin: 6px 0 5px;
          font-family: var(--font-display, "Libre Baskerville", Georgia, serif);
          font-size: 40px;
          line-height: 1;
          letter-spacing: -0.01em;
        }
        .mps-amount__meta {
          font-family: var(--font-mono, ui-monospace, monospace);
          font-size: 10.5px;
          letter-spacing: 0.06em;
          color: #8a7858;
          word-break: break-all;
        }
        .mps-seg {
          position: relative;
          display: grid;
          grid-template-columns: 1fr 1fr;
          border: 1px solid #cdbfa3;
          margin-bottom: 18px;
        }
        .mps-seg__btn {
          appearance: none;
          background: transparent;
          border: 0;
          padding: 13px 0;
          font-family: var(--font-mono, ui-monospace, monospace);
          font-size: 10.5px;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          color: #8a7858;
          cursor: pointer;
          z-index: 1;
          transition: color 0.3s;
        }
        .mps-seg__btn.is-on {
          color: #f3ede1;
        }
        .mps-seg__btn:disabled {
          cursor: not-allowed;
        }
        .mps-seg__ink {
          position: absolute;
          top: 0;
          left: 0;
          width: 50%;
          height: 100%;
          background: #1c1812;
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .mps-fields {
          display: grid;
          gap: 13px;
        }
        .mps-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 13px;
        }
        .mps-field span {
          display: block;
          margin-bottom: 6px;
          font-family: var(--font-mono, ui-monospace, monospace);
          font-size: 9px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #8a7858;
        }
        .mps-field input {
          width: 100%;
          padding: 12px 13px;
          font-family: var(--font-mono, ui-monospace, monospace);
          font-size: 14px;
          letter-spacing: 0.05em;
          color: #1c1812;
          background: rgba(255, 255, 255, 0.55);
          border: 1px solid #cdbfa3;
          border-radius: 0;
          transition: border-color 0.2s, background 0.2s;
        }
        .mps-field input::placeholder {
          color: #b3a583;
        }
        .mps-field input:focus-visible {
          outline: none;
          border-color: #1c1812;
          background: #fff;
        }
        .mps-hint {
          margin: 2px 0 0;
          font-family: var(--font-mono, ui-monospace, monospace);
          font-size: 10px;
          line-height: 1.6;
          color: #94835f;
        }
        .mps-seam {
          height: 24px;
          margin: 18px 0 4px;
          opacity: 0.55;
        }
        .mps-seam svg {
          width: 100%;
          height: 100%;
        }
        .mps-seam__guide {
          stroke: #c9bca0;
          stroke-width: 1;
          stroke-dasharray: 1 7;
        }
        .mps-seam__thread {
          stroke: #9c7c4f;
          stroke-width: 2;
          stroke-dasharray: 9 7;
          stroke-dashoffset: 584;
          opacity: 0;
        }
        .mps-seam__needle {
          fill: #1c1812;
          opacity: 0;
        }
        .mps-seam.is-sewing {
          opacity: 1;
        }
        .mps-seam.is-sewing .mps-seam__thread {
          opacity: 1;
          animation: mps-sew 2.1s cubic-bezier(0.5, 0, 0.2, 1) forwards;
        }
        .mps-seam.is-sewing .mps-seam__needle {
          opacity: 1;
          animation: mps-needle 2.1s cubic-bezier(0.5, 0, 0.2, 1) forwards;
        }
        .mps-err {
          margin: 14px 0 0;
          font-family: var(--font-mono, ui-monospace, monospace);
          font-size: 11px;
          color: #9a2b16;
        }
        .mps-pay {
          appearance: none;
          width: 100%;
          margin-top: 18px;
          padding: 17px;
          font-family: var(--font-mono, ui-monospace, monospace);
          font-size: 11px;
          letter-spacing: 0.26em;
          text-transform: uppercase;
          color: #f3ede1;
          background: #1c1812;
          border: 1px solid #1c1812;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: letter-spacing 0.3s, background 0.3s;
        }
        .mps-pay::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(
            110deg,
            transparent 30%,
            rgba(216, 193, 136, 0.5) 50%,
            transparent 70%
          );
          transform: translateX(-100%);
        }
        .mps-pay:hover:not(:disabled) {
          letter-spacing: 0.34em;
          background: #2a221a;
        }
        .mps-pay:hover:not(:disabled)::after {
          animation: mps-shine 0.9s ease;
        }
        .mps-pay:disabled {
          cursor: progress;
          color: #d8c188;
        }
        .mps-foot {
          margin: 14px 0 0;
          text-align: center;
          font-family: var(--font-mono, ui-monospace, monospace);
          font-size: 8.5px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: #a3936f;
        }
        .mps-done {
          padding: 26px 0 18px;
          text-align: center;
        }
        .mps-seal {
          display: inline-block;
          width: 96px;
          height: 96px;
        }
        .mps-seal svg {
          width: 100%;
          height: 100%;
          fill: none;
          stroke: #9c7c4f;
        }
        .mps-seal__ring {
          stroke-width: 2;
          stroke-dasharray: 314;
          stroke-dashoffset: 314;
          animation: mps-draw 0.7s ease forwards;
        }
        .mps-seal__ring2 {
          stroke-width: 1;
          stroke-dasharray: 251;
          stroke-dashoffset: 251;
          opacity: 0.5;
          animation: mps-draw 0.7s ease 0.12s forwards;
        }
        .mps-seal__tick {
          stroke: #1c1812;
          stroke-width: 4;
          stroke-linecap: square;
          stroke-dasharray: 80;
          stroke-dashoffset: 80;
          animation: mps-draw 0.45s ease 0.5s forwards;
        }
        .mps-done h3 {
          margin: 16px 0 6px;
          font-family: var(--font-display, "Libre Baskerville", Georgia, serif);
          font-size: 26px;
          font-weight: 500;
        }
        .mps-done p {
          margin: 0;
          font-family: var(--font-mono, ui-monospace, monospace);
          font-size: 11px;
          letter-spacing: 0.04em;
          color: #8a7858;
        }
        @keyframes mps-fade {
          from {
            opacity: 0;
          }
        }
        @keyframes mps-rise {
          from {
            opacity: 0;
            transform: translateY(26px) scale(0.97);
          }
        }
        @keyframes mps-sew {
          to {
            stroke-dashoffset: 0;
          }
        }
        @keyframes mps-needle {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(97%);
          }
        }
        @keyframes mps-shine {
          to {
            transform: translateX(100%);
          }
        }
        @keyframes mps-draw {
          to {
            stroke-dashoffset: 0;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .mps-scrim,
          .mps {
            animation: none;
          }
          .mps-seam.is-sewing .mps-seam__thread,
          .mps-seam.is-sewing .mps-seam__needle,
          .mps-seal__ring,
          .mps-seal__ring2,
          .mps-seal__tick {
            animation-duration: 0.01ms;
            animation-iteration-count: 1;
          }
        }
      `}</style>
    </div>
  );
}
