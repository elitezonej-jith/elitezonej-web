type Tone = "neutral" | "success" | "warning" | "brand" | "info";

const MAP: Record<string, { tone: Tone; label: string }> = {
  active:      { tone: "success", label: "Active" },
  draft:       { tone: "neutral", label: "Draft" },
  archived:    { tone: "neutral", label: "Archived" },
  scheduled:   { tone: "info",    label: "Scheduled" },
  published:   { tone: "success", label: "Live" },
  expired:     { tone: "warning", label: "Expired" },
  disabled:    { tone: "neutral", label: "Off" },
  new:         { tone: "brand",   label: "New" },
  contacted:   { tone: "info",    label: "Contacted" },
  done:        { tone: "success", label: "Done" },
  closed:      { tone: "neutral", label: "Closed" },
  confirmed:   { tone: "info",    label: "Confirmed" },
  in_atelier:  { tone: "info",    label: "In atelier" },
  shipped:     { tone: "info",    label: "Shipped" },
  fulfilled:   { tone: "success", label: "Fulfilled" },
  cancelled:   { tone: "neutral", label: "Cancelled" },
  low:         { tone: "warning", label: "Low stock" },
  oos:         { tone: "warning", label: "Out of stock" },
};

export default function StatusTag({
  status, label, tone,
}: {
  status?: string;
  label?: string;
  tone?: Tone;
}) {
  const info = status ? MAP[status] : undefined;
  const t = tone ?? info?.tone ?? "neutral";
  const text = label ?? info?.label ?? status ?? "";
  return <span className={`stu-tag stu-tag--${t}`}>{text}</span>;
}
