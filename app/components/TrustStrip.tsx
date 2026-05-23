// Custom SVGs hand-drawn in the same elegant thin-stroke visual language
// Disturbia uses (FontAwesome Light family — 1.5px strokes, soft curves,
// generous padding inside the viewBox).

const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 1.4, strokeLinecap: "round", strokeLinejoin: "round" } as const;

function CoinsIcon() {
  return (
    <svg viewBox="0 0 48 48" {...stroke}>
      <ellipse cx="24" cy="14" rx="11" ry="3.5" />
      <path d="M13 14v4c0 2 5 3.5 11 3.5s11-1.5 11-3.5v-4" />
      <path d="M13 22v4c0 2 5 3.5 11 3.5s11-1.5 11-3.5v-4" />
      <path d="M13 30v4c0 2 5 3.5 11 3.5s11-1.5 11-3.5v-4" />
    </svg>
  );
}

function TruckIcon() {
  return (
    <svg viewBox="0 0 48 48" {...stroke}>
      <path d="M5 14h22v18H5z" />
      <path d="M27 20h9l5 6v6h-14z" />
      <circle cx="13" cy="34" r="3" />
      <circle cx="35" cy="34" r="3" />
      <path d="M16 34h16" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" {...stroke}>
      <path d="M5 4c0-.6.5-1 1-1h3l1.5 4-2 1.3a13 13 0 0 0 6.2 6.2l1.3-2 4 1.5v3a1 1 0 0 1-1 1A16 16 0 0 1 5 4z" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" {...stroke}>
      <path d="M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-9l-5 4v-4H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" />
      <circle cx="9" cy="11" r=".6" fill="currentColor" stroke="none" />
      <circle cx="15" cy="11" r=".6" fill="currentColor" stroke="none" />
      <path d="M9.5 13.2c.7.6 1.5.9 2.5.9s1.8-.3 2.5-.9" />
    </svg>
  );
}

function EnvelopeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" {...stroke}>
      <rect x="3" y="6" width="18" height="13" rx="1" />
      <path d="M3 7l9 7 9-7" />
    </svg>
  );
}

export default function TrustStrip() {
  return (
    <section className="trust-icons">
      <div className="trust-icons-row">
        <div className="trust-item">
          <CoinsIcon />
          <div className="trust-title">
            <span className="trust-label--full">Duties &amp; Taxes Included</span>
            <span className="trust-label--short">Duties&nbsp;included</span>
          </div>
        </div>
        <div className="trust-item">
          <TruckIcon />
          <div className="trust-title">
            <span className="trust-label--full">Free Delivery</span>
            <span className="trust-label--short">Free&nbsp;delivery</span>
          </div>
          <div className="trust-sub">On orders over ₹15,000</div>
        </div>
      </div>

      <div className="support-row">
        <div className="support-title">Need a helping hand?</div>
        <div className="support-links">
          <a href="tel:+919800000000" aria-label="Call +91 98000 00000">
            <PhoneIcon />
            <span className="trust-label--full">+91 98000 00000</span>
            <span className="trust-label--short">Call</span>
          </a>
          <a href="#chat" aria-label="Open live chat">
            <ChatIcon />
            <span className="trust-label--full">Chat</span>
            <span className="trust-label--short">Chat</span>
          </a>
          <a href="/bespoke" aria-label="Contact us by email">
            <EnvelopeIcon />
            <span className="trust-label--full">Contact Us</span>
            <span className="trust-label--short">Email</span>
          </a>
        </div>
      </div>
    </section>
  );
}
