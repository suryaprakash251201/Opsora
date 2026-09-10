import * as React from "react";
import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-border bg-surface/60 text-foreground placeholder:text-subtle min-h-20 w-full resize-none rounded-md border px-3 py-2 text-sm transition-colors outline-none focus-visible:border-border-strong focus-visible:ring-2 focus-visible:ring-info/40 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
