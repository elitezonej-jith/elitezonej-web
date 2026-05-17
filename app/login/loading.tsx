import "../styles/account.css";

// Lightweight skeleton for the /login route — replaces the full-screen
// wordmark loader (app/loading.tsx) on this exact path. Mirrors the
// real .auth-wrap layout so there is no layout shift on swap-in.
export default function LoginLoading() {
  return (
    <main className="auth-wrap" aria-busy="true" aria-live="polite">
      <span className="skel skel-title" />
      <span className="skel skel-line skel-w-70" />
      <span className="skel skel-block" />
      <span className="skel skel-block" />
      <span className="skel skel-line skel-w-40" />
    </main>
  );
}
