import { cn } from "@/lib/utils";

/**
 * CircuitBackground — an animated PCB-style circuit layer that sits behind
 * the dashboard. Traces are hand-authored with 45°/90° bends; small "signal"
 * pulses travel along a subset of them. Everything is pure SVG + CSS, fully
 * driven by the active theme tokens, and automatically still under
 * `prefers-reduced-motion` (the global CSS zeroes animation durations).
 */

interface Trace {
  /** Path data — orthogonal/diagonal PCB-like trace. */
  d: string;
  /** Signal pulse config; omit for a static trace. */
  pulse?: { duration: string; delay?: string; reverse?: boolean };
  /** Width override for "bus" lines. */
  wide?: boolean;
}

const TRACES: Trace[] = [
  // ————————————————— top edge —————————————————
  { d: "M-20 92 H240 L288 140 H470", pulse: { duration: "9s" } },
  { d: "M520 64 H760 L808 112 H980 L1028 64 H1240", pulse: { duration: "12s", delay: "-4s" } },
  { d: "M1330 96 H1500 L1548 144 H1640" },
  { d: "M-20 150 H120 L168 198 H330", pulse: { duration: "7s", delay: "-2.5s" }, wide: true },

  // ————————————————— left edge —————————————————
  { d: "M96 -20 V260 L144 308 V470", pulse: { duration: "10s", delay: "-6s" } },
  { d: "M170 540 V720 L122 768 V1020" },
  { d: "M52 380 V560 L100 608 V800", pulse: { duration: "8s", delay: "-1s" }, wide: true },

  // ————————————————— right edge —————————————————
  { d: "M1496 -20 V180 L1448 228 V420", pulse: { duration: "11s", delay: "-3s" } },
  { d: "M1420 500 V660 L1468 708 V900", pulse: { duration: "9.5s", delay: "-7s" } },
  { d: "M1548 340 V520 L1500 568 V760", wide: true },

  // ————————————————— bottom edge —————————————————
  { d: "M-20 880 H210 L258 832 H430 L478 880 H690", pulse: { duration: "13s", delay: "-5s" } },
  { d: "M820 920 H1060 L1108 872 H1330", pulse: { duration: "8.5s", delay: "-2s" } },
  { d: "M1180 950 H1420 L1468 902 H1640", pulse: { duration: "10.5s", delay: "-8s" }, wide: true },

  // ————————————————— inner connectors —————————————————
  { d: "M288 140 V240 L336 288 V380" },
  { d: "M1028 64 V160 L980 208 V300", pulse: { duration: "7.5s", delay: "-4.5s" } },
  { d: "M478 880 V780 L526 732 V640" },
  { d: "M1108 872 V760 L1156 712 V600", pulse: { duration: "9s", delay: "-1.5s" } },
];

/** Junction vias — [cx, cy, delay] pairs rendered as glowing pads. */
const VIAS: [number, number, string][] = [
  [288, 140, "0s"],
  [1028, 64, "-2s"],
  [808, 112, "-4s"],
  [144, 308, "-1s"],
  [1448, 228, "-3s"],
  [100, 608, "-5s"],
  [1468, 708, "-2.5s"],
  [258, 832, "-6s"],
  [1108, 872, "-3.5s"],
  [526, 732, "-1.5s"],
  [122, 768, "-4.5s"],
  [1500, 568, "-7s"],
];

export function CircuitBackground({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none fixed inset-0 -z-10 overflow-hidden", className)}
    >
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1600 1000"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        <defs>
          {/* Faint engineering grid */}
          <pattern id="circuit-grid" width="56" height="56" patternUnits="userSpaceOnUse">
            <path
              d="M56 0H0V56"
              className="circuit-grid-line"
              strokeWidth="0.6"
            />
          </pattern>
          {/* Fade the circuitry toward the center so content stays readable */}
          <radialGradient id="circuit-fade" cx="50%" cy="46%" r="75%">
            <stop offset="0%" stopColor="white" stopOpacity="0.25" />
            <stop offset="55%" stopColor="white" stopOpacity="0.75" />
            <stop offset="100%" stopColor="white" stopOpacity="1" />
          </radialGradient>
          <mask id="circuit-mask">
            <rect width="1600" height="1000" fill="url(#circuit-fade)" />
          </mask>
        </defs>

        <rect width="1600" height="1000" fill="url(#circuit-grid)" className="circuit-grid" />

        <g mask="url(#circuit-mask)">
          {TRACES.map((trace, i) => (
            <g key={i}>
              <path
                d={trace.d}
                pathLength={100}
                className="circuit-trace"
                strokeWidth={trace.wide ? 1.6 : 1}
              />
              {trace.pulse ? (
                <path
                  d={trace.d}
                  pathLength={100}
                  className="circuit-pulse"
                  strokeWidth={trace.wide ? 2 : 1.4}
                  style={{
                    animationDuration: trace.pulse.duration,
                    animationDelay: trace.pulse.delay ?? "0s",
                    animationDirection: trace.pulse.reverse ? "reverse" : "normal",
                  }}
                />
              ) : null}
            </g>
          ))}

          {VIAS.map(([cx, cy, delay], i) => (
            <g key={i} className="circuit-via" style={{ animationDelay: delay }}>
              <circle cx={cx} cy={cy} r="5.5" className="circuit-via-ring" />
              <circle cx={cx} cy={cy} r="2.4" className="circuit-via-core" />
            </g>
          ))}
        </g>
      </svg>

      {/* Soft brand aura so the circuitry blends into the theme */}
      <div className="circuit-aura absolute inset-0" />
    </div>
  );
}
