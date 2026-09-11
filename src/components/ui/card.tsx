import * as React from "react";
import { cn } from "@/lib/utils";

interface CardProps extends React.ComponentProps<"div"> {
  /** Add a subtle multi-color halo in the corner of the card. */
  accent?: string;
  /** When true, slightly lift the card on hover (e.g. for clickable tiles). */
  interactive?: boolean;
  /** Use the glassmorphism background. Defaults to true. */
  glass?: boolean;
  /** Use the animated gradient border. Defaults to true. */
  gradientBorder?: boolean;
  /** Trigger the shine-on-hover sweep. Defaults to true. */
  shine?: boolean;
}

function Card({
  className,
  accent,
  interactive,
  glass = true,
  gradientBorder = true,
  shine = true,
  ...props
}: CardProps) {
  return (
    <div
      data-slot="card"
      className={cn(
        "group/card relative overflow-hidden rounded-xl border shadow-[inset_0_1px_0_0_color-mix(in_oklab,var(--foreground)_4%,transparent)]",
        "transition-[border-color,box-shadow,transform] duration-300 ease-out",
        glass && "card-glass",
        gradientBorder && "gradient-border",
        shine && "shine-on-hover",
        interactive &&
          "hover:-translate-y-0.5 hover:shadow-[0_18px_44px_-22px_color-mix(in_oklab,var(--brand)_45%,transparent)]",
        className,
      )}
      style={{
        borderColor: "color-mix(in oklab, var(--border) 70%, transparent)",
        ...props.style,
      }}
      {...props}
    >
      {accent ? (
        <span
          aria-hidden
          className="pointer-events-none absolute -top-16 -right-16 size-44 rounded-full opacity-30 blur-3xl transition-opacity duration-500 group-hover/card:opacity-55"
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