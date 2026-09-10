import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/60 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "text-white shadow-[0_4px_14px_-4px_color-mix(in_oklab,var(--brand)_45%,transparent)]",
        secondary:
          "border bg-[var(--surface)] text-[var(--foreground)] border-[var(--border)] hover:bg-[var(--surface-hover)]",
        ghost: "text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]",
        outline:
          "border border-[var(--border)] text-[var(--foreground)] bg-transparent hover:bg-[var(--surface)]",
        destructive:
          "border border-[color-mix(in_oklab,var(--danger)_30%,transparent)] bg-[color-mix(in_oklab,var(--danger)_10%,transparent)] text-[var(--danger)] hover:bg-[color-mix(in_oklab,var(--danger)_18%,transparent)]",
        success:
          "border border-[color-mix(in_oklab,var(--success)_30%,transparent)] bg-[color-mix(in_oklab,var(--success)_10%,transparent)] text-[var(--success)] hover:bg-[color-mix(in_oklab,var(--success)_18%,transparent)]",
        link: "text-[var(--brand)] underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-7 rounded-md px-2.5 text-xs [&_svg]:size-3.5",
        default: "h-8.5 px-3 [&_svg]:size-4",
        lg: "h-10 px-4 [&_svg]:size-4",
        icon: "size-8.5 [&_svg]:size-4",
        "icon-sm": "size-7 [&_svg]:size-3.5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  style,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  // Default = brand gradient
  const computedStyle: React.CSSProperties =
    variant === "default"
      ? {
          background:
            "linear-gradient(135deg, var(--brand) 0%, var(--brand-2) 100%)",
          ...style,
        }
      : (style ?? {});

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      style={computedStyle}
      {...props}
    />
  );
}

export { Button, buttonVariants };
