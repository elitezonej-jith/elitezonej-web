import { sanitizeRichHtml } from "@/lib/sanitize";

export default function CustomHtml({ html }: { html: string }) {
  if (!html) return null;
  const safe = sanitizeRichHtml(html);
  if (!safe) return null;
  return (
    <section style={{ padding: "32px 5vw" }}>
      <div dangerouslySetInnerHTML={{ __html: safe }} />
    </section>
  );
}
