import * as React from "react";
import { cn } from "@/lib/utils";

interface CardProps extends React.ComponentProps<"div"> {
  /** Add a subtle multi-color halo in the corner of the card. */
  accent?: string;
  /** When true, slightly lift the card on hover (e.g. for clickable tiles). */
  interactive?: boolean;
}

function Card({ className, accent, interactive, ...props }: CardProps) {
  return (
    <div
      data-slot="card"
      className={cn(
        "relative overflow-hidden rounded-[10px] border shadow-[0_1px_0_0_rgba(255,255,255,0.02)_inset]",
        interactive &&
          "transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-12px_color-mix(in_oklab,var(--brand)_25%,transparent)]",
        className,
      )}
      style={{
        background: "var(--panel)",
        borderColor: "var(--border)",
      }}
      {...props}
    >
      {accent ? (
        <span
          aria-hidden
          className="pointer-events-none absolute -top-16 -right-16 size-44 rounded-full opacity-30 blur-3xl"
          style={{ background: accent }}
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
        "border-border/70 flex items-center gap-2 border-t px-4 py-2.5",
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
