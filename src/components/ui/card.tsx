import * as React from "react";
import { cn } from "@/lib/utils";

interface CardProps extends React.ComponentProps<"div"> {
  /** Solid accent used for a thin top rule. Omit for a plain card. */
  accent?: string;
  /** When true, highlight the border on hover (e.g. for clickable tiles). */
  interactive?: boolean;
  /** Use the elevated surface with top bevel highlight. Defaults to true. */
  elevated?: boolean;
  /** Use the glassmorphism background. Defaults to false (flat panel). */
  glass?: boolean;
  /** Use the animated gradient border. Defaults to false (plain border). */
  gradientBorder?: boolean;
  /** Trigger the shine-on-hover sweep. Defaults to false. */
  shine?: boolean;
}

function Card({
  className,
  accent,
  interactive,
  elevated = true,
  glass = false,
  gradientBorder = false,
  shine = false,
  ...props
}: CardProps) {
  return (
    <div
      data-slot="card"
      className={cn(
        "group/card relative overflow-hidden rounded-xl border bg-panel",
        "transition-all duration-200",
        elevated && "card-elevated",
        glass && "card-glass",
        gradientBorder && "gradient-border",
        shine && "shine-on-hover",
        interactive && "hover:border-border-strong cursor-pointer hover:-translate-y-0.5",
        className,
      )}
      style={{
        borderColor: "color-mix(in oklab, var(--border) 75%, transparent)",
        ...props.style,
      }}
      {...props}
    >
      {accent ? (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[2px] opacity-90 transition-opacity group-hover/card:opacity-100"
          style={{
            background: accent,
            boxShadow: `0 1px 8px ${accent}`,
          }}
        />
      ) : null}
      {props.children}
    </div>
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "flex items-start justify-between gap-3 px-4 pt-3.5 pb-2",
        className,
      )}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return (
    <h3
      data-slot="card-title"
      className={cn(
        "flex items-center gap-2 text-[13px] font-medium tracking-tight",
        className,
      )}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="card-description"
      className={cn("text-muted text-xs", className)}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-4 pt-1 pb-3.5", className)}
      {...props}
    />
  );
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "border-border/60 flex items-center gap-2 border-t px-4 py-2.5",
        className,
      )}
      {...props}
    />
  );
}

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
};