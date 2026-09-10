import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = { title: "GitHub" };

export default function GithubLayout({ children }: { children: ReactNode }) {
  return children;
}
