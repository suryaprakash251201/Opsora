import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = { title: "Calendar" };

export default function CalendarLayout({ children }: { children: ReactNode }) {
  return children;
}
