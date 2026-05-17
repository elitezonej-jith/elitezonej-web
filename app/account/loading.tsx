import "../styles/account.css";

// Lightweight skeleton for the /account route ("My account" path) —
// replaces the full-screen wordmark loader (app/loading.tsx). Mirrors
// the real .account-shell / .account-grid / .account-card layout so
// there is no layout shift when the real content swaps in.
export default function AccountLoading() {
  return (
    <main className="account-shell" aria-busy="true" aria-live="polite">
      <span
        className="skel skel-title"
        style={{ height: "clamp(28px,4vw,40px)", marginBottom: 28 }}
      />
      <div className="account-grid">
        <section className="account-card">
          <span className="skel skel-line skel-w-40" />
          <span className="skel skel-block" />
          <span className="skel skel-block" />
          <span className="skel skel-line skel-w-70" />
        </section>
        <section className="account-card">
          <span className="skel skel-line skel-w-40" />
          <span className="skel skel-line" />
          <span className="skel skel-line" />
          <span className="skel skel-line skel-w-70" />
        </section>
      </div>
    </main>
  );
}
