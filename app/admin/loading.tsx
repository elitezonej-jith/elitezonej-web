export default function AdminLoading() {
  return (
    <div className="adm-page" aria-busy="true" aria-live="polite">
      <div style={{ width: 56, height: 1, background: "var(--adm-accent)", marginBottom: 18 }} />
      <div className="skel-shimmer" style={{ width: 220, height: 40, marginBottom: 28 }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skel-shimmer" style={{ height: 120 }} />
        ))}
      </div>
      <div className="skel-shimmer" style={{ height: 280 }} />
    </div>
  );
}
