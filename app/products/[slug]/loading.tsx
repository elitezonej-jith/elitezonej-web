export default function ProductLoading() {
  return (
    <div style={{ padding: "120px 5vw 80px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48 }} aria-busy="true" aria-live="polite">
      <div className="skel-shimmer" style={{ aspectRatio: "3/4" }} />
      <div>
        <div className="skel-shimmer" style={{ height: 14, width: "30%", marginBottom: 16 }} />
        <div className="skel-shimmer" style={{ height: 40, width: "80%", marginBottom: 16 }} />
        <div className="skel-shimmer" style={{ height: 14, width: "60%", marginBottom: 24 }} />
        <div className="skel-shimmer" style={{ height: 28, width: "35%", marginBottom: 32 }} />
        <div className="skel-shimmer" style={{ height: 56 }} />
      </div>
    </div>
  );
}
