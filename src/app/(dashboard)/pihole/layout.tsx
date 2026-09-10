import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = { title: "Pi-hole" };

export default function PiholeLayout({ children }: { children: ReactNode }) {
  return children;
}
