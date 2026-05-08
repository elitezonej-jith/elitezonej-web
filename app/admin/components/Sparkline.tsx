type Point = { day: string; total: number };

export default function Sparkline({ data, height = 56 }: { data: Point[]; height?: number }) {
  if (!data.length) return null;
  const w = 320;
  const h = height;
  const max = Math.max(1, ...data.map((d) => d.total));
  const step = data.length > 1 ? w / (data.length - 1) : 0;
  const points = data.map((d, i) => {
    const x = i * step;
    const y = h - 4 - (d.total / max) * (h - 8);
    return [x, y] as const;
  });
  const path = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const fill = `${path} L${(points.at(-1)?.[0] ?? 0).toFixed(1)},${h} L0,${h} Z`;
  return (
    <svg className="adm-spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
      <line className="adm-spark__base" x1={0} x2={w} y1={h - 0.5} y2={h - 0.5} />
      <path className="adm-spark__fill" d={fill} />
      <path className="adm-spark__path" d={path} />
    </svg>
  );
}
