export default function CustomHtml({ html }: { html: string }) {
  if (!html) return null;
  return (
    <section style={{ padding: "32px 5vw" }}>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </section>
  );
}
