type Props = {
  status: "healthy" | "low" | "oos";
  label?: string;
};

const labels: Record<Props["status"], string> = {
  healthy: "Healthy",
  low: "Low stock",
  oos: "Out of stock",
};

export default function StatusPill({ status, label }: Props) {
  return (
    <span className={`inv2-pill inv2-pill--${status}`}>
      {label ?? labels[status]}
    </span>
  );
}
