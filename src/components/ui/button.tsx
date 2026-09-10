import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-info/60 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-foreground text-background hover:bg-foreground/90",
        secondary:
          "border-border bg-surface text-foreground hover:bg-surface-hover border",
        ghost: "text-muted hover:bg-surface hover:text-foreground",
        outline:
          "border-border text-foreground hover:bg-surface border bg-transparent",
        destructive:
          "border-danger/30 bg-danger/10 text-danger hover:bg-danger/20 border",
        success:
          "border-success/30 bg-success/10 text-success hover:bg-success/20 border",
        link: "text-info underline-offset-4 hover:underline",
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
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Button, buttonVariants };
