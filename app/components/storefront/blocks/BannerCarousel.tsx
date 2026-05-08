"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Banner } from "../../../../lib/admin/repos/banners";

export default function BannerCarousel({ banners, autoplay }: { banners: Banner[]; autoplay: number }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (banners.length < 2 || autoplay < 2) return;
    const t = setInterval(() => setI((x) => (x + 1) % banners.length), autoplay * 1000);
    return () => clearInterval(t);
  }, [banners.length, autoplay]);
  if (!banners.length) return null;
  const b = banners[i];
  return (
    <section style={{
      position: "relative",
      width: "100%", aspectRatio: "21/9", maxHeight: "70vh",
      overflow: "hidden", background: "#1A1613",
    }}>
      {b.image_path && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={b.image_path} alt={b.title} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
      )}
      <div style={{
        position: "absolute", inset: 0,
        padding: "6%", display: "flex", flexDirection: "column",
        justifyContent: "center",
        alignItems: b.text_align === "center" ? "center" : b.text_align === "right" ? "flex-end" : "flex-start",
        textAlign: b.text_align === "center" ? "center" : b.text_align === "right" ? "right" : "left",
        color: b.text_color === "dark" ? "#1A1613" : "#FAF7F2",
        background: b.text_color === "dark"
          ? "linear-gradient(120deg, rgba(255,255,255,0.10), rgba(255,255,255,0.45))"
          : "linear-gradient(120deg, rgba(0,0,0,0.45), rgba(0,0,0,0.05))",
      }}>
        {b.title && (
          <h2 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: "clamp(28px, 4vw, 56px)", fontWeight: 500, margin: 0, lineHeight: 1.05 }}>
            {b.title}
          </h2>
        )}
        {b.subtitle && <p style={{ marginTop: 12, maxWidth: "55ch", fontSize: 15 }}>{b.subtitle}</p>}
        {b.button_text && b.button_href && (
          <Link href={b.button_href}
                style={{ marginTop: 22, padding: "12px 24px",
                         background: b.text_color === "dark" ? "#1A1613" : "#FAF7F2",
                         color: b.text_color === "dark" ? "#FAF7F2" : "#1A1613",
                         fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase",
                         fontWeight: 500, textDecoration: "none" }}>
            {b.button_text}
          </Link>
        )}
      </div>
      {banners.length > 1 && (
        <div style={{ position: "absolute", bottom: 22, left: 0, right: 0, textAlign: "center", display: "flex", gap: 8, justifyContent: "center" }}>
          {banners.map((_, k) => (
            <button key={k} onClick={() => setI(k)}
                    aria-label={`Banner ${k + 1}`}
                    style={{
                      width: k === i ? 28 : 10, height: 4,
                      background: k === i ? "#FAF7F2" : "rgba(250,247,242,0.5)",
                      border: "none", padding: 0, cursor: "pointer",
                      transition: "width 240ms ease",
                    }} />
          ))}
        </div>
      )}
    </section>
  );
}
