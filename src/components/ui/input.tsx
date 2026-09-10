import * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "border-border bg-surface/60 text-foreground placeholder:text-subtle h-8.5 w-full min-w-0 rounded-md border px-3 text-sm transition-colors outline-none focus-visible:border-border-strong focus-visible:ring-2 focus-visible:ring-info/40 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
