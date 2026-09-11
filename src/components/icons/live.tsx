import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

/**
 * Live icons — hand-rolled animated SVG icons.
 *
 * Every icon runs a subtle idle loop (blinking LEDs, traveling pulses,
 * equalizer bars) so the interface feels alive, and the surrounding
 * `.group` hover triggers extra motion (bell swing, gear turn, check draw).
 * All motion is pure CSS defined in globals.css — zero JS cost — and is
 * automatically disabled under `prefers-reduced-motion`.
 *
 * Drop-in compatible with how the shell renders lucide icons:
 *   <Icon className="…" style={{…}} strokeWidth={1.8} />
 */
export interface LiveIconProps {
  className?: string;
  style?: CSSProperties;
  strokeWidth?: number | string;
}

function baseProps({ className, style, strokeWidth = 1.8 }: LiveIconProps) {
  return {
    className: cn("live-icon", className),
    style,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
}

/* ————————————————————————— Home ————————————————————————— */

export function LiveHome(props: LiveIconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M4 11.2 12 4l8 7.2" />
      <path d="M6 9.8V20h12V9.8" />
      {/* heartbeat inside the house — the "attention" signal */}
      <path className="li-flow" d="M8.4 14.6h1.7l1.2-2.7 1.8 5 1.2-2.3h1.5" />
      <circle className="li-led" cx="12" cy="17.9" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

/* ————————————————————————— Todos ———————————————————————— */

export function LiveTodo(props: LiveIconProps) {
  return (
    <svg {...baseProps(props)}>
      <rect x="4" y="4" width="16" height="16" rx="3.5" />
      <path className="li-draw" d="m8 12.4 2.5 2.5L16 9.4" />
      <circle className="li-led" cx="17.3" cy="6.7" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

/* ————————————————————————— Calendar ————————————————————— */

export function LiveCalendar(props: LiveIconProps) {
  return (
    <svg {...baseProps(props)}>
      <rect x="4" y="6" width="16" height="14.5" rx="3" />
      <path d="M4 10.6h16" />
      <path d="M8.5 3.6v3.4M15.5 3.6v3.4" />
      {/* today's event, gently pulsing */}
      <circle className="li-led" cx="12" cy="15.4" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

/* ————————————————————————— GitHub ——————————————————————— */

export function LiveGithub(props: LiveIconProps) {
  return (
    <svg {...baseProps(props)}>
      <circle className="li-ping" cx="12" cy="12" r="9.2" />
      <path
        fill="currentColor"
        stroke="none"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2Z"
      />
    </svg>
  );
}

/* ————————————————————————— Docker ——————————————————————— */

export function LiveDocker(props: LiveIconProps) {
  return (
    <svg {...baseProps(props)}>
      {/* container stack; top box floats */}
      <rect x="6.2" y="13" width="3.4" height="3.4" rx="0.7" />
      <rect x="10.3" y="13" width="3.4" height="3.4" rx="0.7" />
      <rect x="14.4" y="13" width="3.4" height="3.4" rx="0.7" />
      <g className="li-bob">
        <rect x="10.3" y="8.9" width="3.4" height="3.4" rx="0.7" />
        <circle className="li-led" cx="12" cy="10.6" r="0.6" fill="currentColor" stroke="none" />
      </g>
      {/* water line with flowing dashes */}
      <path className="li-flow" d="M3.5 19.6c1.7-1.1 3.4-1.1 5.1 0s3.4 1.1 5.1 0 3.4-1.1 5.1 0" />
    </svg>
  );
}

/* ————————————————————————— Servers —————————————————————— */

export function LiveServer(props: LiveIconProps) {
  return (
    <svg {...baseProps(props)}>
      <rect x="4" y="4.6" width="16" height="6.4" rx="2" />
      <rect x="4" y="13" width="16" height="6.4" rx="2" />
      <path d="M8 7.8h5M8 16.2h5" />
      <circle className="li-led" cx="16.6" cy="7.8" r="1.05" fill="currentColor" stroke="none" />
      <circle className="li-led li-led-delay" cx="16.6" cy="16.2" r="1.05" fill="currentColor" stroke="none" />
    </svg>
  );
}

/* ————————————————————————— Pi-hole —————————————————————— */

export function LiveShield(props: LiveIconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M12 3.2 5 6v5.4c0 4.3 3 7.4 7 9.4 4-2 7-5.1 7-9.4V6l-7-2.8Z" />
      <path className="li-draw" d="m9 11.8 2.2 2.2 3.8-4" />
    </svg>
  );
}

/* ————————————————————————— Analytics ———————————————————— */

export function LiveAnalytics(props: LiveIconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M4 4v15.2c0 .4.4.8.8.8H20" />
      <rect className="li-bar" x="7.2" y="12" width="2.9" height="5.2" rx="0.8" fill="currentColor" stroke="none" />
      <rect className="li-bar li-bar-2" x="11.5" y="8.6" width="2.9" height="8.6" rx="0.8" fill="currentColor" stroke="none" />
      <rect className="li-bar li-bar-3" x="15.8" y="10.8" width="2.9" height="6.4" rx="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

/* ————————————————————————— Alerts ——————————————————————— */

export function LiveBell(props: LiveIconProps) {
  return (
    <svg {...baseProps(props)}>
      <circle className="li-ping" cx="12" cy="5.6" r="2.6" />
      <g className="li-bell-body">
        <path d="M6.2 16.8v-5.4a5.8 5.8 0 0 1 11.6 0v5.4l1.7 2.2H4.5l1.7-2.2Z" />
        <path d="M10.4 21.4a1.8 1.8 0 0 0 3.2 0" />
      </g>
      <circle className="li-led" cx="12" cy="5.4" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

/* ————————————————————————— Settings ————————————————————— */

export function LiveSettings(props: LiveIconProps) {
  return (
    <svg {...baseProps(props)}>
      <g className="li-gear">
        <path d="M12 8.7a3.3 3.3 0 1 0 0 6.6 3.3 3.3 0 0 0 0-6.6Z" />
        <path d="M12 2.9v2.2M12 18.9v2.2M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M2.9 12h2.2M18.9 12h2.2M4.9 19.1l1.6-1.6M17.5 6.5l1.6-1.6" />
      </g>
      <circle className="li-led" cx="12" cy="12" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

/* ————————————————————————— Brand mark ——————————————————— */

export function LiveLogo(props: LiveIconProps) {
  return (
    <svg {...baseProps(props)}>
      {/* rotating dashed halo */}
      <circle className="li-spin-slow" cx="12" cy="12" r="10.4" strokeDasharray="2.5 4.5" opacity="0.65" />
      {/* the Opsora diamond */}
      <path d="M12 4.6 19.4 12 12 19.4 4.6 12 12 4.6Z" />
      <path d="M12 8.2 15.8 12 12 15.8 8.2 12 12 8.2Z" opacity="0.55" />
      <circle className="li-led" cx="12" cy="12" r="1.15" fill="currentColor" stroke="none" />
    </svg>
  );
}
