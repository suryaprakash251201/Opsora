import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = { title: "Todos" };

export default function TodosLayout({ children }: { children: ReactNode }) {
  return children;
}
