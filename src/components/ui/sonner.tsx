"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="dark"
      position="bottom-right"
      toastOptions={{
        style: {
          background: "var(--panel)",
          border: "1px solid var(--border)",
          color: "var(--foreground)",
        },
        classNames: {
          description: "text-muted",
          actionButton: "bg-foreground text-background",
        },
      }}
      {...props}
    />
  );
}

export { Toaster };
