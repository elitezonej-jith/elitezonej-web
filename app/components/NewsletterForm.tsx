"use client";
import { useActionState } from "react";
import { subscribeNewsletter, type NewsletterState } from "./actions/newsletter";

const initial: NewsletterState = {};

export default function NewsletterForm() {
  const [state, action, pending] = useActionState(subscribeNewsletter, initial);

  if (state.ok) {
    return (
      <p className="news-done t-mono-xs" role="status">
        Thank you — you’re on the list.
      </p>
    );
  }

  return (
    <form className="news" action={action}>
      <input
        type="email"
        name="email"
        placeholder="Email address"
        aria-label="Email address"
        required
        disabled={pending}
      />
      <button type="submit" disabled={pending}>
        {pending ? "Subscribing…" : "Subscribe"}
      </button>
      {state.error && (
        <span className="news-err t-mono-xs" role="alert" style={{ color: "#b00" }}>
          {state.error}
        </span>
      )}
    </form>
  );
}
