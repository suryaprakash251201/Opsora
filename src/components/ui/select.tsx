import * as React from "react";
import { cn } from "@/lib/utils";

function Select({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      data-slot="select"
      className={cn(
        "border-border bg-surface/60 text-foreground h-8.5 w-full rounded-md border px-2.5 text-sm transition-colors outline-none focus-visible:border-border-strong focus-visible:ring-2 focus-visible:ring-info/40 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Select };
