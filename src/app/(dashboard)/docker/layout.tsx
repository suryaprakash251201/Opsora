import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = { title: "Docker" };

export default function DockerLayout({ children }: { children: ReactNode }) {
  return children;
}
