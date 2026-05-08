type Item = { kicker?: unknown; label?: unknown };

export default function TrustStrip({ items }: { items: Item[] }) {
  if (!items.length) return null;
  return (
    <section style={{
      padding: "32px 5vw",
      borderTop: "1px solid rgba(26,22,19,0.10)",
      borderBottom: "1px solid rgba(26,22,19,0.10)",
    }}>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fit, minmax(200px, 1fr))`, gap: 24, alignItems: "center", textAlign: "center" }}>
        {items.map((it, i) => (
          <div key={i}>
            {it.kicker ? <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: "#7A1C1C", display: "block", marginBottom: 6 }}>{String(it.kicker)}</span> : null}
            <span style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 17, fontStyle: "italic", color: "#1A1613" }}>{String(it.label ?? "")}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
