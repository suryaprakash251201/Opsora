import { cn } from "@/lib/utils";

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  stroke?: string;
  strokeWidth?: number;
  fill?: boolean;
  className?: string;
  /** Optional explicit bounds so multiple sparklines share a scale */
  min?: number;
  max?: number;
}

export function Sparkline({
  data,
  width = 120,
  height = 32,
  stroke = "currentColor",
  strokeWidth = 1.5,
  fill = true,
  className,
  min: minOverride,
  max: maxOverride,
}: SparklineProps) {
  if (data.length < 2) {
    return <div className={className} style={{ height }} aria-hidden />;
  }

  const min = minOverride ?? Math.min(...data);
  const max = maxOverride ?? Math.max(...data);
  const range = max - min || 1;
  const pad = 2;
  const usable = height - pad * 2;
  const stepX = width / (data.length - 1);

  const points = data.map((value, index) => {
    const x = index * stepX;
    const y = height - pad - ((value - min) / range) * usable;
    return [x, y] as const;
  });

  const line = points
    .map(([x, y], index) => `${index === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`)
    .join(" ");
  const area = `${line} L${width},${height} L0,${height} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={cn("block", className)}
      aria-hidden
    >
      {fill ? <path d={area} fill="currentColor" opacity={0.12} /> : null}
      <path
        d={line}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
