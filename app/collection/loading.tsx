export default function CollectionLoading() {
  return (
    <div style={{ padding: "120px 5vw 80px" }} aria-busy="true" aria-live="polite">
      <div className="skel-shimmer" style={{ width: 240, height: 36, marginBottom: 32 }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 24 }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i}>
            <div className="skel-shimmer" style={{ aspectRatio: "3/4" }} />
            <div className="skel-shimmer" style={{ height: 14, width: "70%", marginTop: 12 }} />
            <div className="skel-shimmer" style={{ height: 12, width: "40%", marginTop: 8 }} />
          </div>
        ))}
      </div>
    </div>
  );
}
