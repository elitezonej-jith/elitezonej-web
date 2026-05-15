export default function StudioLoading() {
  return (
    <div style={{ padding: 40 }} aria-busy="true" aria-live="polite">
      <div className="skel-shimmer" style={{ width: 200, height: 32, marginBottom: 24 }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skel-shimmer" style={{ height: 100 }} />
        ))}
      </div>
      <div className="skel-shimmer" style={{ height: 260 }} />
    </div>
  );
}
