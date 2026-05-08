type Variant =
  | "active" | "draft" | "archived"
  | "low" | "oos"
  | "success" | "warning" | "info"
  | "accent" | "ink";

const LABELS: Record<string, string> = {
  active: "Active",
  draft: "Draft",
  archived: "Archived",
  low: "Low stock",
  oos: "Out of stock",
  new: "New",
  confirmed: "Confirmed",
  in_atelier: "In atelier",
  shipped: "Shipped",
  fulfilled: "Fulfilled",
  cancelled: "Cancelled",
  contacted: "Contacted",
  scheduled: "Scheduled",
  done: "Done",
  closed: "Closed",
  scheduled_promo: "Scheduled",
  expired: "Expired",
  disabled: "Disabled",
};

function pickVariant(status: string): Variant {
  switch (status) {
    case "active":
    case "fulfilled":
    case "shipped":
    case "done":
      return "success";
    case "draft":
    case "closed":
      return "draft";
    case "archived":
      return "archived";
    case "in_atelier":
    case "confirmed":
    case "scheduled":
    case "contacted":
      return "info";
    case "cancelled":
    case "expired":
    case "disabled":
      return "archived";
    case "new":
      return "accent";
    case "oos":
      return "oos";
    case "low":
      return "low";
    default:
      return "info";
  }
}

export default function StatusPill({
  status,
  label,
  variant,
}: {
  status?: string;
  label?: string;
  variant?: Variant;
}) {
  const v = variant ?? (status ? pickVariant(status) : "info");
  const text = label ?? (status ? LABELS[status] ?? status : "");
  return <span className={`adm-pill adm-pill--${v}`}>{text}</span>;
}
