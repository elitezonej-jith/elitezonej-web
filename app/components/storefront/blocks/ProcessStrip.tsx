type Step = { kicker?: unknown; title?: unknown; body?: unknown; image?: unknown };

export default function ProcessStrip({ steps }: { steps: Step[] }) {
  if (!steps.length) return null;
  return (
    <section style={{ padding: "64px 5vw 48px", background: "#F2EDE4" }}>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fit, minmax(220px, 1fr))`, gap: 32 }}>
        {steps.map((s, i) => {
          const image = String(s.image ?? "");
          return (
            <div key={i}>
              {image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={image} alt="" style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover", display: "block" }} />
              )}
              <div style={{ padding: "16px 0 0" }}>
                {s.kicker ? <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: "#7A1C1C" }}>{String(s.kicker)}</span> : null}
                <h3 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 22, fontWeight: 500, margin: "8px 0 6px" }}>{String(s.title ?? "")}</h3>
                {s.body ? <p style={{ fontSize: 14, color: "#55493E", margin: 0, maxWidth: "32ch" }}>{String(s.body)}</p> : null}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
